/* =====================================================================
   Сборка архива для публикации. node без зависимостей.

   Сборщика у игры нет и не будет (§2 CLAUDE.md): этот скрипт ничего не
   компилирует и не минифицирует, он только раскладывает нужные файлы
   в dist/ и заворачивает их в zip, который принимает площадка.

   Запуск:  node tools/build.js
            node tools/build.js --out=dist --name=setup
===================================================================== */

import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync, crc32 } from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const args = Object.fromEntries(process.argv.slice(2)
  .filter(a => a.startsWith('--'))
  .map(a => a.slice(2).split('=')));

const OUT = join(ROOT, args.out || 'dist');
const NAME = args.name || 'setup';

/* Что попадает в архив. Всё остальное — CLAUDE.md, docs, tools,
   package.json, прототип — игроку не нужно и место в архиве не занимает. */
const INCLUDE = ['index.html', 'src', 'assets'];

/* ---- сбор файлов ------------------------------------------------------ */
function walk(path, list = []){
  if(!existsSync(path)) return list;
  const st = statSync(path);
  if(st.isDirectory()){
    for(const name of readdirSync(path).sort()) walk(join(path, name), list);
  }else{
    list.push(path);
  }
  return list;
}

/* ---- минимальный zip --------------------------------------------------
   Пишем сами: тянуть зависимость ради архива запрещает §2, а формат
   простой. Deflate берём из встроенного zlib.
--------------------------------------------------------------------- */
function zip(entries){
  const chunks = [], central = [];
  let offset = 0;

  for(const e of entries){
    const nameBuf = Buffer.from(e.name.split(sep).join('/'), 'utf8');
    const deflated = deflateRawSync(e.data, { level: 9 });
    /* если сжатие не помогло, кладём как есть — так делает и обычный zip */
    const useDeflate = deflated.length < e.data.length;
    const body = useDeflate ? deflated : e.data;
    const method = useDeflate ? 8 : 0;
    const sum = crc32(e.data) >>> 0;

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);   // сигнатура
    localHeader.writeUInt16LE(20, 4);           // версия
    localHeader.writeUInt16LE(0x0800, 6);       // имена в UTF-8
    localHeader.writeUInt16LE(method, 8);
    localHeader.writeUInt16LE(0, 10);           // время
    localHeader.writeUInt16LE(0x21, 12);        // дата (условная)
    localHeader.writeUInt32LE(sum, 14);
    localHeader.writeUInt32LE(body.length, 18);
    localHeader.writeUInt32LE(e.data.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    chunks.push(localHeader, nameBuf, body);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(method, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0x21, 14);
    centralHeader.writeUInt32LE(sum, 16);
    centralHeader.writeUInt32LE(body.length, 20);
    centralHeader.writeUInt32LE(e.data.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt32LE(offset, 42);    // смещение локальной записи
    central.push(centralHeader, nameBuf);

    offset += localHeader.length + nameBuf.length + body.length;
  }

  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...chunks, centralBuf, end]);
}

/* ---- самопроверки перед сборкой ---------------------------------------
   Дешевле поймать здесь, чем получить отказ модерации.
--------------------------------------------------------------------- */
function selfCheck(files){
  const problems = [];
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');

  if(/<\s*(audio|video)[\s>]/i.test(html)){
    problems.push('в index.html есть тег <audio> или <video> — запрещено правилами площадки');
  }
  if(!/position:\s*fixed/.test(html)){
    problems.push('в index.html не видно position: fixed на body — страница будет скроллиться');
  }
  const sources = files.filter(f => f.endsWith('.js'));
  for(const f of sources){
    const code = readFileSync(f, 'utf8');
    if(/document\.createElement\(\s*['"](audio|video)['"]\s*\)/.test(code)){
      problems.push(`${relative(ROOT, f)}: создаётся тег audio/video`);
    }
    if(/['"]ru['"]/.test(code) && !f.endsWith('i18n.js')){
      problems.push(`${relative(ROOT, f)}: похоже на хардкод языка`);
    }
  }
  return problems;
}

/* ---- сборка ------------------------------------------------------------ */
const files = INCLUDE.flatMap(p => walk(join(ROOT, p)))
  .filter(f => !f.endsWith('.md'));      // README из assets в архив не нужен

if(!files.length){
  console.error('Нечего собирать: не найдены', INCLUDE.join(', '));
  process.exit(1);
}

const problems = selfCheck(files);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const entries = [];
let total = 0;
for(const f of files){
  const rel = relative(ROOT, f);
  const data = readFileSync(f);
  total += data.length;
  const dest = join(OUT, rel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, data);
  entries.push({ name: rel, data });
}

const archive = zip(entries);
const zipPath = join(OUT, NAME + '.zip');
writeFileSync(zipPath, archive);

const kb = n => (n / 1024).toFixed(1) + ' КБ';
console.log('СЕТАП — сборка для площадки');
console.log('  файлов          ', entries.length);
console.log('  распакованный   ', kb(total));
console.log('  архив           ', kb(archive.length), '->', relative(ROOT, zipPath));
console.log('  бюджет §2       ', total < 300 * 1024 ? 'ок, меньше 300 КБ' : 'ПРЕВЫШЕН, больше 300 КБ');

if(problems.length){
  console.log('');
  console.log('  Самопроверка нашла проблемы:');
  for(const p of problems) console.log('   -', p);
  process.exitCode = 1;
}else{
  console.log('  самопроверка     ок: тегов audio/video нет, скролл заблокирован, язык не захардкожен');
}

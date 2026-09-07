/* =====================================================================
   Симулятор баланса. node без зависимостей.

   Импортирует те же config.js / economy.js и ту же функцию step(), что и
   игра, — модель здесь ровно одна, разъехаться ей негде.

   Запуск:  node tools/sim.js
            node tools/sim.js --minutes=90 --rates=0,3,5,8
===================================================================== */

import { CATEGORIES, MAX_LEVEL, LOOP, HEAT, DUST, SCENE, PRESTIGE } from '../src/config.js';
import * as Economy from '../src/economy.js';
import * as State from '../src/state.js';
import * as HeatSys from '../src/systems/heat.js';
import { step, applyManualClick, buy } from '../src/main.js';
import { pathToFileURL } from 'node:url';

/* ---- аргументы -------------------------------------------------------- */
const args = Object.fromEntries(process.argv.slice(2)
  .filter(a => a.startsWith('--'))
  .map(a => a.slice(2).split('=')));

const MINUTES = Number(args.minutes || 60);
const RATES = String(args.rates || '0,3,5').split(',').map(Number);
const BUCKET = 5 * 60;                     // пятиминутные отрезки
const CLEAN_AT = 0.75;                     // когда моделируемый игрок чистит корпус

/* Модель игрока намеренно простая, но не самоубийственная:
   - жмёт «Разгон» только на холодной системе, иначе он мгновенно загонит её
     в перегрев и будет мерить не баланс, а собственную глупость;
   - перестаёт кликать, пока идёт троттлинг, и возвращается, когда остыло.
     Именно этот ритм и задуман в §4.2. */

const mmss = s => {
  if(s === null || s === undefined) return '  —  ';
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return String(m).padStart(3) + ':' + String(r).padStart(2, '0');
};
const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);

/* ---- политика покупок -------------------------------------------------
   Покупаем самое дешёвое из доступного. Блок питания сам по себе дохода
   не даёт, поэтому его берём только когда упёрлись в ватты — живой игрок
   поступает так же. Именно этот момент и есть «затык по ваттам».
--------------------------------------------------------------------- */
function autobuy(state, log, time){
  for(let guard = 0; guard < 30; guard++){
    let best = null, wattBlocked = false;

    for(const c of CATEGORIES){
      if(c.id === 'psu') continue;               // только по нужде, см. ниже
      const chk = Economy.purchaseCheck(state, c.id);
      if(chk.reason === 'max') continue;
      if(chk.reason === 'watts'){
        if(state.money >= chk.price) wattBlocked = true;
        continue;
      }
      if(!chk.ok) continue;
      if(!best || chk.price < best.price) best = { id: c.id, price: chk.price };
    }

    if(wattBlocked && log.firstWattBlock === null) log.firstWattBlock = time;
    if(wattBlocked){
      const psu = Economy.purchaseCheck(state, 'psu');
      if(psu.ok) best = { id: 'psu', price: psu.price };
    }
    if(!best) return;

    if(!buy(state, best.id)) return;
    const lvl = state.levels[best.id];
    log.levelAt[best.id][lvl] = time;
    if(log.firstBuy === null){ log.firstBuy = time; log.firstBuyId = best.id; }
    if(log.allCategories === null && CATEGORIES.every(c => state.levels[c.id] > 0)){
      log.allCategories = time;
    }
  }
}

/* ---- один прогон ------------------------------------------------------- */
export function run(cps, minutes){
  const state = State.createState();
  const dt = LOOP.fixedStep;
  const total = minutes * 60;

  const log = {
    cps,
    firstBuy: null, firstBuyId: null,
    firstWattBlock: null,
    firstThrottle: null,
    allCategories: null,
    reach5m: null,
    levelAt: {},
    buckets: [],
    throttleTime: 0,
    cleans: 0,
    boosts: 0
  };
  for(const c of CATEGORIES) log.levelAt[c.id] = new Array(MAX_LEVEL + 1).fill(null);

  let clickAcc = 0;
  let bucketStart = 0, bucketEarned = 0;
  let prevEarned = 0;
  let time = 0;

  while(time < total){
    /* клики игрока: во время троттлинга игрок ждёт, пока остынет */
    if(state.throttling) clickAcc = 0;
    else clickAcc += cps * dt;
    while(clickAcc >= 1){
      clickAcc -= 1;
      applyManualClick(state);
    }

    /* разгон, пока не жарко */
    if(HeatSys.boostReady(state) && !state.throttling &&
       state.heat < HEAT.zones[1].from){
      HeatSys.startBoost(state);
      log.boosts += 1;
    }

    step(state, dt);
    time += dt;

    if(state.throttling){
      log.throttleTime += dt;
      if(log.firstThrottle === null) log.firstThrottle = time;
    }
    if(log.reach5m === null && state.earned >= PRESTIGE.threshold) log.reach5m = time;

    /* чистка корпуса */
    if(state.dust >= CLEAN_AT){ state.dust = 0; log.cleans += 1; }

    autobuy(state, log, time);

    /* доход по пятиминутным отрезкам */
    if(time - bucketStart >= BUCKET){
      log.buckets.push((state.earned - prevEarned) / (BUCKET / 60));
      prevEarned = state.earned;
      bucketStart = time;
    }
  }
  if(time - bucketStart > 1){
    log.buckets.push((state.earned - prevEarned) / ((time - bucketStart) / 60));
  }
  log.state = state;
  return log;
}

/* ---- печать ------------------------------------------------------------ */
function report(log){
  const s = log.state;
  console.log('');
  console.log('='.repeat(78));
  console.log(`ТЕМП ${log.cps} кликов/сек — ${MINUTES} игровых минут`);
  console.log('='.repeat(78));

  console.log(`  первая покупка      ${mmss(log.firstBuy)}` +
              (log.firstBuyId ? `   (${log.firstBuyId})` : ''));
  console.log(`  первый затык по Вт  ${mmss(log.firstWattBlock)}`);
  console.log(`  первый троттлинг    ${mmss(log.firstThrottle)}`);
  console.log(`  все 14 категорий    ${mmss(log.allCategories)}`);
  console.log(`  переезд (${PRESTIGE.threshold.toLocaleString('ru-RU')} ₽) ${mmss(log.reach5m)}`);
  console.log(`  заработано за прогон ${Math.round(s.earned).toLocaleString('ru-RU')} ₽`);
  console.log(`  под троттлингом     ${(log.throttleTime / 60).toFixed(1)} мин ` +
              `(${(log.throttleTime / (MINUTES * 60) * 100).toFixed(0)}% времени)`);
  console.log(`  чисток корпуса ${log.cleans} · разгонов ${log.boosts} · ` +
              `заказов сдано ${s.ordersDone}`);
  console.log(`  ватты в финале      ${Math.round(Economy.totalWatts(s.levels))} / ` +
              `${Math.round(Economy.wattLimit(s.levels))}`);

  console.log('');
  console.log('  Время до уровня (мин:сек):');
  console.log('  ' + pad('категория', 12) +
    [1, 2, 3, 4, 5, 6, 7].map(n => padL('ур.' + n, 7)).join(''));
  for(const c of CATEGORIES){
    const cells = [];
    for(let n = 1; n <= MAX_LEVEL; n++){
      const at = log.levelAt[c.id][n];
      cells.push(padL(at === null ? '—' : mmss(at).trim(), 7));
    }
    console.log('  ' + pad(c.id, 12) + cells.join('') + '   ур.' + s.levels[c.id]);
  }

  console.log('');
  console.log('  Доход по пятиминутным отрезкам (₽/мин):');
  log.buckets.forEach((v, i) => {
    const from = i * 5, to = from + 5;
    console.log('  ' + pad(`${from}–${to} мин`, 12) + padL(Math.round(v).toLocaleString('ru-RU'), 16));
  });
}

/* ---- цели из §5/§9 CLAUDE.md ------------------------------------------- */
function goals(logs){
  const ref = logs.find(l => l.cps === 3) || logs[0];
  const ok = v => (v ? 'ок  ' : 'мимо');
  console.log('');
  console.log('='.repeat(78));
  console.log('ЦЕЛИ ИЗ CLAUDE.md (по темпу 3 клика/сек)');
  console.log('='.repeat(78));

  const first = ref.firstBuy;
  const watt = ref.firstWattBlock;
  const all = ref.allCategories;

  console.log(`  первая покупка < 15 сек        ${mmss(first)}   ${ok(first !== null && first < 15)}`);
  console.log(`  затык по ваттам 2–4 мин        ${mmss(watt)}   ${ok(watt !== null && watt >= 120 && watt <= 240)}`);
  console.log(`  все категории к 8-й минуте     ${mmss(all)}   ${ok(all !== null && all <= 480)}`);
  console.log(`  первый троттлинг случился      ${mmss(ref.firstThrottle)}   ${ok(ref.firstThrottle !== null)}`);
  const move = ref.reach5m;
  console.log(`  первый переезд 25–40 мин       ${mmss(move)}   ${ok(move !== null && move >= 1500 && move <= 2400)}`);
  console.log('');
  console.log('  Переезд по темпам (механика — фаза 3, здесь только момент):');
  for(const l of logs){
    console.log(`    ${l.cps} кликов/сек: ` +
      (l.reach5m !== null
        ? `${mmss(l.reach5m)}, всего ${Math.round(l.state.earned).toLocaleString('ru-RU')} ₽`
        : `не достигнут за ${MINUTES} мин (${Math.round(l.state.earned).toLocaleString('ru-RU')} ₽)`));
  }
}

/* ---- запуск ---------------------------------------------------------
   Печатаем отчёт только при прямом вызове: tools/tune.js импортирует run().
--------------------------------------------------------------------- */
function main(){
console.log(`СЕТАП — симулятор баланса. Шаг ${LOOP.fixedStep.toFixed(4)} с, ` +
            `сцена ${SCENE.W}×${SCENE.H}, уровней ${MAX_LEVEL + 1}.`);
console.log(`Модель игрока: чистит корпус при пыли ${Math.round(CLEAN_AT * 100)}%, ` +
            `жмёт «Разгон» только ниже ${HEAT.zones[1].from}°, ` +
            `а во время троттлинга перестаёт кликать и ждёт остывания.`);

const logs = RATES.map(r => run(r, MINUTES));
logs.forEach(report);
goals(logs);
}

const invoked = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if(invoked) main();

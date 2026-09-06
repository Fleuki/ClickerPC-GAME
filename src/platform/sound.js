/* =====================================================================
   Звук. Только Web Audio API — теги <audio> и <video> запрещены
   требованиями Яндекс.Игр (§2 CLAUDE.md).

   Файлов в репозитории нет: взять их можно только вручную из CC0-наборов
   (см. assets/sfx/README.md). Модуль рассчитан именно на это — не
   загрузившийся файл просто молчит, игра работает как обычно.

   Процедурный синтез не используется намеренно: §2 предупреждает, что
   модераторы Playgama помечают синтезированный звук как AI-generated.
===================================================================== */

import { SOUND } from '../config.js';

let ctx = null;
let master = null;
let muted = false;
let unlocked = false;
const buffers = new Map();      // имя -> AudioBuffer
const missing = new Set();      // чего нет на диске — больше не просим
let voices = 0;

/* AudioContext можно создавать только после жеста пользователя, иначе
   браузер оставит его в состоянии suspended. */
function ensureContext(){
  if(ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if(!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : SOUND.master;
  master.connect(ctx.destination);
  return ctx;
}

async function loadOne(name){
  const def = SOUND.bank[name];
  if(!def || missing.has(name)) return null;
  if(buffers.has(name)) return buffers.get(name);
  try{
    const res = await fetch(SOUND.dir + def.file);
    if(!res.ok) throw new Error(String(res.status));
    const data = await res.arrayBuffer();
    const buf = await ctx.decodeAudioData(data);
    buffers.set(name, buf);
    return buf;
  }catch(e){
    missing.add(name);          // файла нет — тихо живём дальше
    return null;
  }
}

/* Разблокировка по первому касанию: тогда же подтягиваем банк. */
export function unlock(){
  if(unlocked || !SOUND.enabled) return;
  unlocked = true;
  if(!ensureContext()) return;
  if(ctx.state === 'suspended') ctx.resume();
  for(const name in SOUND.bank) loadOne(name);
}

export function play(name, opts){
  if(!SOUND.enabled || muted || !unlocked || !ctx) return;
  const def = SOUND.bank[name];
  const buf = buffers.get(name);
  if(!def || !buf) return;
  if(voices >= SOUND.maxVoices) return;

  const src = ctx.createBufferSource();
  src.buffer = buf;
  if(opts && opts.spread){
    src.playbackRate.value = 1 + (Math.random() - 0.5) * 2 * opts.spread;
  }
  const gain = ctx.createGain();
  gain.gain.value = def.volume * ((opts && opts.volume) || 1);
  src.connect(gain).connect(master);
  voices += 1;
  src.onended = () => { voices -= 1; };
  src.start();
}

export const click = () => play('click', { spread: SOUND.clickRateSpread });
export const crit  = () => play('crit');

export function setMuted(v){
  muted = !!v;
  if(master) master.gain.value = muted ? 0 : SOUND.master;
  return muted;
}
export const isMuted = () => muted;

/* Что из банка реально загрузилось — для самопроверки из консоли. */
export function status(){
  return {
    enabled: SOUND.enabled,
    unlocked,
    context: ctx ? ctx.state : null,
    loaded: [...buffers.keys()],
    missing: [...missing]
  };
}

/* Пыль: копится, режет охлаждение, чистится шестью тапами по корпусу. */

import { DUST } from '../config.js';
import { clamp, dustRate } from '../economy.js';

export function update(state, dt){
  state.dust = clamp(state.dust + dustRate(state.levels) * dt, 0, DUST.max);
  if(state.cleaning){
    state.cleaning.timer -= dt;
    if(state.cleaning.timer <= 0) cancel(state);
  }
}

/* Пыльные пятна в нормированных координатах корпуса: рендер и попадание
   пользуются одними и теми же числами. */
function makeSpots(){
  const S = DUST.spot, spots = [];
  for(let i = 0; i < DUST.taps; i++){
    spots.push({
      x: S.x0 + Math.random() * S.xSpan,
      y: S.y0 + (i + Math.random() * S.jitter) / DUST.taps * S.ySpan,
      r: S.rMin + Math.random() * S.rSpan,
      done: false
    });
  }
  return spots;
}

export const canClean = state => state.dust > 0 && !state.cleaning;

export function start(state){
  if(!canClean(state)) return false;
  state.cleaning = { spots: makeSpots(), left: DUST.taps, timer: DUST.tapTime };
  return true;
}

export function cancel(state){ state.cleaning = null; }

/* Тап по сцене во время чистки. nx, ny — координаты внутри корпуса (0..1).
   Возвращает индекс протёртого пятна или -1. */
export function tap(state, nx, ny){
  const c = state.cleaning;
  if(!c) return -1;
  for(let i = 0; i < c.spots.length; i++){
    const s = c.spots[i];
    if(s.done) continue;
    const dx = nx - s.x, dy = ny - s.y;
    if(dx * dx + dy * dy <= s.r * s.r){
      s.done = true;
      c.left -= 1;
      c.timer = DUST.tapTime;
      if(c.left <= 0){ state.dust = 0; state.cleaning = null; }
      return i;
    }
  }
  return -1;
}

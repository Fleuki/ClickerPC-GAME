/* Переезд и репутация (§6).

   Переезд, а не абстрактный «престиж»: награда здесь визуальная — новая
   комната, новая палитра и базовый множитель. Железо сбрасывается,
   репутация остаётся навсегда. */

import { PRESTIGE, ORDERS, CATEGORIES } from '../config.js';

export const available = state => state.earned >= PRESTIGE.threshold;

/* Сколько репутации даст переезд прямо сейчас. */
export function reputationGain(state){
  if(!available(state)) return 0;
  return Math.floor(PRESTIGE.repFactor *
    Math.pow(state.earned / PRESTIGE.threshold, PRESTIGE.repPower));
}

/* Множитель локации: каждая следующая комната втрое щедрее предыдущей. */
export function locationMult(location){
  return Math.pow(PRESTIGE.locationMult, Math.max(0, location || 0));
}

/* Доля до переезда 0..1 — для полосы в интерфейсе. */
export function progress(state){
  return Math.max(0, Math.min(1, state.earned / PRESTIGE.threshold));
}

/* Сам переезд. Возвращает сколько репутации получено, или 0. */
export function move(state){
  const gain = reputationGain(state);
  if(gain <= 0) return 0;

  state.reputation += gain;
  state.location = Math.min(PRESTIGE.locations - 1, (state.location || 0) + 1);
  state.moves = (state.moves || 0) + 1;

  /* сбрасывается только железо и текущий забег */
  for(const c of CATEGORIES) state.levels[c.id] = 0;
  state.money = 0;
  state.earned = 0;
  state.heat = 0;
  state.throttling = false;
  state.dust = 0;
  state.combo = 0;
  state.comboTimer = 0;
  state.boost.left = 0;
  state.boost.cooldown = 0;
  state.autoAcc = 0;
  state.order = null;
  state.orderTimer = ORDERS.firstDelay;   // на новом месте тоже не сразу
  state.cat = null;
  return gain;
}

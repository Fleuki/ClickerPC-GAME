/* Достижения (§11, фаза 3).

   Список намеренно короткий и целиком выводится из уже существующих
   механик: §10 запрещает добавлять новые. Проверяются раз в секунду,
   а не каждый кадр — считать тут нечего, но и незачем. */

import { MAX_LEVEL, CATEGORIES, PRESTIGE, COMBO } from '../config.js';

export const LIST = [
  { id: 'firstBuy',   test: s => CATEGORIES.some(c => s.levels[c.id] > 0) },
  { id: 'allOnce',    test: s => CATEGORIES.every(c => s.levels[c.id] > 0) },
  { id: 'maxOne',     test: s => CATEGORIES.some(c => s.levels[c.id] >= MAX_LEVEL) },
  { id: 'maxAll',     test: s => CATEGORIES.every(c => s.levels[c.id] >= MAX_LEVEL) },
  { id: 'clicks1k',   test: s => s.clicks >= 1000 },
  { id: 'clicks10k',  test: s => s.clicks >= 10000 },
  { id: 'combo',      test: s => s.combo >= COMBO.maxCombo },
  { id: 'throttle',   test: s => s.throttling },
  { id: 'spotless',   test: s => s.cleans >= 10 },
  { id: 'orders10',   test: s => s.ordersDone >= 10 },
  { id: 'move',       test: s => (s.moves || 0) >= 1 },
  { id: 'moveAll',    test: s => (s.location || 0) >= PRESTIGE.locations - 1 }
];

/* Возвращает список id, открывшихся именно сейчас. */
export function check(state){
  const fresh = [];
  for(const a of LIST){
    if(state.achievements.includes(a.id)) continue;
    let ok = false;
    try{ ok = a.test(state); }catch(e){ ok = false; }
    if(ok){ state.achievements.push(a.id); fresh.push(a.id); }
  }
  return fresh;
}

export const unlockedCount = state => state.achievements.length;
export const total = () => LIST.length;

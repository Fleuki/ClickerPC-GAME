/* =====================================================================
   Формулы экономики. Чистые функции без DOM — их импортирует и игра,
   и симулятор баланса tools/sim.js.
===================================================================== */

import {
  CATEGORIES, MAX_LEVEL, ECONOMY, HEAT, DUST, COMBO
} from './config.js';

const BY_ID = new Map(CATEGORIES.map(c => [c.id, c]));

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export function category(id){
  const c = BY_ID.get(id);
  if(!c) throw new Error('unknown category: ' + id);
  return c;
}

export function levelOf(levels, id){
  return clamp(Math.floor(levels[id] || 0), 0, MAX_LEVEL);
}

/* ---- значение одного эффекта на уровне n --------------------------- */
export function trackValue(track, level){
  switch(track.kind){
    case 'mul':  return track.V0 * Math.pow(track.m, level);
    case 'mul1': return level === 0 ? 0 : track.V0 * Math.pow(track.m, level - 1);
    case 'add': {
      const v = track.V0 + track.step * level;
      return track.max === undefined ? v : Math.min(v, track.max);
    }
    default: throw new Error('unknown track kind: ' + track.kind);
  }
}

/* Значение эффекта категории при текущих уровнях. */
export function value(levels, id, effect){
  const track = category(id).effects[effect];
  if(!track) throw new Error('no effect ' + effect + ' on ' + id);
  return trackValue(track, levelOf(levels, id));
}

/* Значение эффекта на произвольном уровне — для карточек «что даст следующий». */
export function valueAt(id, effect, level){
  const track = category(id).effects[effect];
  if(!track) return 0;
  return trackValue(track, clamp(level, 0, MAX_LEVEL));
}

/* ---- цены ---------------------------------------------------------- */
export function cost(id, targetLevel){
  if(targetLevel < 1 || targetLevel > MAX_LEVEL) return Infinity;
  const c = category(id).cost;
  return Math.round(c.C0 * Math.pow(c.r, targetLevel - 1));
}
export function nextCost(levels, id){
  return cost(id, levelOf(levels, id) + 1);
}

/* ---- ватты --------------------------------------------------------- */
export function watts(id, level){
  const w = category(id).watts;
  if(level <= 0) return w.zeroWattsAtLevel0 ? 0 : w.W0;
  return w.W0 + w.Wk * level;
}
export function totalWatts(levels){
  let sum = 0;
  for(const c of CATEGORIES) sum += watts(c.id, levelOf(levels, c.id));
  return sum;
}
export function wattLimit(levels){
  return value(levels, 'psu', 'wattLimit');
}
/* Сколько будет занято, если поднять одну категорию на уровень. */
export function wattsAfterUpgrade(levels, id){
  const l = levelOf(levels, id);
  return totalWatts(levels) - watts(id, l) + watts(id, l + 1);
}
/* Нехватка ватт для покупки: 0 — влезает. */
export function wattDeficit(levels, id){
  return Math.max(0, Math.ceil(wattsAfterUpgrade(levels, id) - wattLimit(levels)));
}

/* ---- можно ли купить ------------------------------------------------
   Возвращает { ok, reason, price, deficit }.
   reason: 'max' | 'money' | 'watts' | null
--------------------------------------------------------------------- */
export function purchaseCheck(state, id){
  const level = levelOf(state.levels, id);
  if(level >= MAX_LEVEL) return { ok:false, reason:'max', price:Infinity, deficit:0 };
  const price = cost(id, level + 1);
  const deficit = wattDeficit(state.levels, id);
  if(deficit > 0) return { ok:false, reason:'watts', price, deficit };
  if(state.money < price) return { ok:false, reason:'money', price, deficit:0 };
  return { ok:true, reason:null, price, deficit:0 };
}

/* ---- множители ------------------------------------------------------ */
export function globalMult(levels, reputation = 0){
  let m = 1;
  for(const c of CATEGORIES){
    if(c.effects.globalMult) m *= value(levels, c.id, 'globalMult');
  }
  return m * (1 + ECONOMY.repBonus * reputation);
}

export function heatMult(heat, throttling){
  if(throttling) return HEAT.throttleIncome;
  let m = HEAT.zones[0].mult;
  for(const z of HEAT.zones) if(heat >= z.from) m = z.mult;
  return m;
}

export function comboMult(combo){
  return COMBO.base + Math.min(combo, COMBO.maxCombo) * COMBO.perStep;
}

export function comboWindow(levels){
  return value(levels, 'headphones', 'comboWindow');
}

export function boostMult(state){
  return state.boost.left > 0 ? HEAT.boost.income : 1;
}

export function critChance(levels){
  return value(levels, 'mouse', 'critChance');
}

/* ---- доход ---------------------------------------------------------- */

/* Цена одного ручного клика без крита. */
export function clickValue(state){
  return value(state.levels, 'cpu', 'clickBase')
       * value(state.levels, 'mouse', 'clickMult')
       * globalMult(state.levels, state.reputation)
       * heatMult(state.heat, state.throttling)
       * comboMult(state.combo)
       * boostMult(state);
}

/* Цена одного автоклика: доля от цены клика, без крита. */
export function autoClickValue(state){
  return clickValue(state) * ECONOMY.autoClickShare;
}

/* Автокликов в секунду: клавиатура × оперативка. */
export function autoCps(state){
  return value(state.levels, 'keyboard', 'autoCps')
       * value(state.levels, 'ram', 'autoMult');
}

/* Пассивный доход видеокарты, ₽/сек. */
export function passiveIncome(state){
  return value(state.levels, 'gpu', 'income')
       * globalMult(state.levels, state.reputation)
       * heatMult(state.heat, state.throttling)
       * boostMult(state)
       * (state.throttling ? HEAT.throttlePassive : 1);
}

/* Суммарный доход в секунду для HUD: автоклики + пассив. */
export function incomePerSecond(state){
  const auto = state.throttling ? 0 : autoCps(state) * autoClickValue(state);
  return auto + passiveIncome(state);
}

/* ---- тепло ---------------------------------------------------------- */
export function heatGeneration(levels){
  let g = 0;
  for(const id in HEAT.perLevel) g += HEAT.perLevel[id] * levelOf(levels, id);
  return g;
}

export function coolRate(levels, dust){
  const raw = value(levels, 'cooler', 'cooling') + value(levels, 'ac', 'cooling');
  return raw * (1 - DUST.coolPenalty * clamp(dust, 0, DUST.max));
}

/* ---- пыль ------------------------------------------------------------ */
export function dustRate(levels){
  return DUST.rate * value(levels, 'ac', 'dustFactor');
}

/* ---- оффлайн (значения считаем уже сейчас, применяем в фазе 3) -------- */
export function offlineShare(levels){ return value(levels, 'ssd', 'offlineShare'); }
export function offlineHours(levels){ return value(levels, 'ssd', 'offlineHours'); }

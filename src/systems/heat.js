/* Нагрев, зоны, троттлинг с гистерезисом, «Разгон». */

import { HEAT } from '../config.js';
import { clamp, heatGeneration, coolRate } from '../economy.js';

export const boosting = state => state.boost.left > 0;

/* Множитель нагрева от разгона. */
const heatScale = state => (boosting(state) ? HEAT.boost.heat : 1);

/* Тепло от клика. auto = true для автоклика клавиатуры. */
export function addClickHeat(state, auto){
  state.heat = clamp(
    state.heat + (auto ? HEAT.perAutoClick : HEAT.perClick) * heatScale(state),
    HEAT.min, HEAT.max
  );
  applyThrottle(state);
}

/* Гистерезис: вход при throttleIn, выход только ниже throttleOut.
   Пороги не пересекаются, поэтому дребезга на границе быть не может. */
function applyThrottle(state){
  if(!state.throttling && state.heat >= HEAT.throttleIn) state.throttling = true;
  else if(state.throttling && state.heat < HEAT.throttleOut) state.throttling = false;
}

export function update(state, dt){
  const gen = heatGeneration(state.levels) * heatScale(state);
  const cool = coolRate(state.levels, state.dust, state);
  state.heat = clamp(state.heat + (gen - cool) * dt, HEAT.min, HEAT.max);
  applyThrottle(state);

  if(state.boost.left > 0){
    state.boost.left = Math.max(0, state.boost.left - dt);
    if(state.boost.left === 0) state.boost.cooldown = HEAT.boost.cooldown;
  }else if(state.boost.cooldown > 0){
    state.boost.cooldown = Math.max(0, state.boost.cooldown - dt);
  }
}

export const boostReady = state => state.boost.left <= 0 && state.boost.cooldown <= 0;

export function startBoost(state){
  if(!boostReady(state)) return false;
  state.boost.left = HEAT.boost.duration;
  return true;
}

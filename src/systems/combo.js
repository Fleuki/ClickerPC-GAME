/* Серия кликов: окно сброса зависит от наушников, множитель до x2.5. */

import { COMBO } from '../config.js';
import { comboWindow } from '../economy.js';

/* Только ручные клики наращивают серию — автоклики держали бы её вечно. */
export function registerClick(state){
  state.combo = Math.min(state.combo + 1, COMBO.maxCombo);
  state.comboTimer = comboWindow(state.levels);
}

export function update(state, dt){
  if(state.comboTimer > 0){
    state.comboTimer -= dt;
    if(state.comboTimer <= 0){
      state.comboTimer = 0;
      state.combo = 0;
    }
  }
}

/* Доля оставшегося окна, 0..1 — для индикатора серии. */
export function windowLeft(state){
  const w = comboWindow(state.levels);
  return w > 0 ? Math.max(0, Math.min(1, state.comboTimer / w)) : 0;
}

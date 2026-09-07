/* Кот (§6).

   Появляется с 3 уровня декора, ходит по столу, иногда садится на
   клавиатуру и глушит автоклики, пока его не согнали. Тап по коту —
   «погладить»: +50% к клику на полминуты.

   Позиция хранится долей ширины стола (0..1), а не пикселями: система
   ничего не знает о раскладке сцены, перевод в координаты — дело рендера. */

import { CAT } from '../config.js';

const rand = (a, b) => a + Math.random() * (b - a);

export const present = state => (state.levels.decor || 0) >= CAT.fromDecorLevel;

function spawn(){
  return {
    x: 0.75, dir: -1,
    mode: 'walk', timer: rand(CAT.walkMin, CAT.walkMax),
    blockLeft: 0, petLeft: 0, petCd: 0
  };
}

/* Кот сидит на клавиатуре — автоклики стоят. */
export const blocksAuto = state => !!(state.cat && state.cat.blockLeft > 0);

/* Множитель клика от «погладить». */
export function petMult(state){
  return state.cat && state.cat.petLeft > 0 ? 1 + CAT.petBonus : 1;
}

export function update(state, dt){
  if(!present(state)){ state.cat = null; return; }
  if(!state.cat) state.cat = spawn();
  const c = state.cat;

  if(c.petLeft > 0) c.petLeft = Math.max(0, c.petLeft - dt);
  if(c.petCd > 0)   c.petCd = Math.max(0, c.petCd - dt);

  if(c.mode === 'keyboard'){
    c.blockLeft = Math.max(0, c.blockLeft - dt);
    if(c.blockLeft <= 0) startWalk(c);
    return;
  }

  c.timer -= dt;
  if(c.mode === 'walk'){
    c.x += c.dir * CAT.speed * dt;
    if(c.x < 0.06){ c.x = 0.06; c.dir = 1; }
    if(c.x > 0.94){ c.x = 0.94; c.dir = -1; }
    if(c.timer <= 0){
      if(Math.random() < CAT.keyboardChance) sitOnKeyboard(c);
      else { c.mode = 'rest'; c.timer = rand(CAT.restMin, CAT.restMax); }
    }
  }else if(c.timer <= 0){
    startWalk(c);
  }
}

function startWalk(c){
  c.mode = 'walk';
  c.timer = rand(CAT.walkMin, CAT.walkMax);
  c.blockLeft = 0;
  c.dir = Math.random() < 0.5 ? -1 : 1;
}

function sitOnKeyboard(c){
  c.mode = 'keyboard';
  c.x = CAT.keyboardX;
  c.blockLeft = CAT.keyboardBlock;
}

/* Тап по коту. Сидит на клавиатуре — сгоняем, иначе гладим.
   Возвращает 'shoo' | 'pet' | null. */
export function touch(state){
  const c = state.cat;
  if(!c) return null;
  if(c.mode === 'keyboard'){ startWalk(c); return 'shoo'; }
  if(c.petCd > 0) return null;
  c.petLeft = CAT.petDuration;
  c.petCd = CAT.petCooldown;
  return 'pet';
}

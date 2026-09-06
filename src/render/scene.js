/* =====================================================================
   Оркестратор кадра: камера, safe-zone, порядок слоёв.
   Логическая сцена SCENE.W x SCENE.H, гарантированно видна центральная
   safe-zone SCENE.SAFE_W x SCENE.SAFE_H. Фон дорисовывается за границы
   сцены, поэтому пустых полей на любом экране не бывает.
===================================================================== */

import { SCENE, LEVELS_PER_VISUAL_STATE, MAX_LEVEL } from '../config.js';
import * as Room from './layers/room.js';
import * as Desk from './layers/desk.js';
import * as Tower from './layers/tower.js';
import * as Monitor from './layers/monitor.js';
import * as Peripherals from './layers/peripherals.js';
import * as FX from './fx.js';

/* ---- координаты предметов на сцене (не баланс — только композиция) ---- */
export const LAYOUT = {
  floorY:    612,
  desk:      { x0:150, x1:870, top:452, thick:20, legW:18 },
  monitor:   { cx:400, base:450 },
  tower:     { x:700, y:220, w:124, h:232 },
  keyboard:  { cx:380, y:458, w:240, h:30 },
  mouse:     { cx:560, y:468 },
  headphones:{ cx:666, y:452 },   /* в просвете между правым экраном и корпусом */
  figurines: { x:168, y:452 },
  lamp:      { x:850, y:452 },
  chair:     { cx:400, top:542 },
  window:    { x:16,  y:68,  w:180, h:180 },
  ac:        { x:690, y:40,  w:156, h:80 },
  poster:    { x:872, y:110, w:112, h:150 },
  plant:     { x:34,  y:612 }
};

let canvas = null, ctx = null;
const view = { scale:1, ox:0, oy:0, dpr:1, cssW:0, cssH:0, x0:0, y0:0, x1:0, y1:0 };

/* ---- общие примитивы отрисовки, раздаются слоям через контекст ---- */
function rr(c, x, y, w, h, r){
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
function glow(c, x, y, r, color, alpha){
  if(r <= 0 || alpha <= 0) return;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  const prev = c.globalAlpha;
  c.globalAlpha = alpha;
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
  c.globalAlpha = prev;
}
/* Бегущий цвет RGB-подсветки. */
function hue(t, offset){ return `hsl(${(t * 55 + offset) % 360} 90% 62%)`; }

/* Визуальное состояние категории: 8 уровней -> 4 вида (§7). */
export function visual(level){
  return Math.min(3, Math.floor(Math.max(0, Math.min(MAX_LEVEL, level)) / LEVELS_PER_VISUAL_STATE));
}

/* ---- камера --------------------------------------------------------- */
export function init(el){
  canvas = el;
  ctx = canvas.getContext('2d', { alpha: false });
  resize();
}

export function resize(){
  if(!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, rect.width), h = Math.max(1, rect.height);
  const dpr = Math.min(window.devicePixelRatio || 1, SCENE.MAX_DPR);

  canvas.width  = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);

  view.cssW = w; view.cssH = h; view.dpr = dpr;
  /* масштаб, при котором safe-zone заведомо помещается целиком */
  view.scale = Math.min(w / SCENE.SAFE_W, h / SCENE.SAFE_H);
  view.ox = (w - SCENE.W * view.scale) / 2;
  view.oy = (h - SCENE.H * view.scale) / 2;

  view.x0 = -view.ox / view.scale;
  view.y0 = -view.oy / view.scale;
  view.x1 = view.x0 + w / view.scale;
  view.y1 = view.y0 + h / view.scale;
}

/* Экранные координаты -> координаты сцены. */
export function toScene(clientX, clientY){
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left - view.ox) / view.scale,
    y: (clientY - rect.top  - view.oy) / view.scale
  };
}

/* Прямоугольник корпуса — нужен вводу для попаданий по пыли. */
export function towerRect(){ return LAYOUT.tower; }

/* ---- кадр ------------------------------------------------------------ */
export function draw(state, time, dt){
  if(!ctx) return;
  const s = view.scale * view.dpr;
  ctx.setTransform(s, 0, 0, s, view.ox * view.dpr, view.oy * view.dpr);

  const shake = FX.shakeOffset();
  ctx.save();
  if(shake.x || shake.y) ctx.translate(shake.x, shake.y);

  const g = {
    ctx, state, t: time, dt,
    L: LAYOUT, view,
    rr:   (x, y, w, h, r) => rr(ctx, x, y, w, h, r),
    glow: (x, y, r, c, a) => glow(ctx, x, y, r, c, a),
    hue,
    vs:   id => visual(state.levels[id] || 0),
    lvl:  id => state.levels[id] || 0
  };

  Room.drawBack(g);          // стена, окно, настенный декор, кондиционер, подсветка
  Desk.draw(g);              // стол
  Peripherals.drawDeskDecor(g);
  Tower.draw(g);             // системник и всё, что внутри
  Monitor.draw(g);           // мониторы
  Peripherals.draw(g);       // клавиатура, мышь, наушники, лампа
  Room.drawHeat(g);          // волны жара и всполохи перегрева
  FX.draw(g);                // частицы, числа, индикатор серии
  Room.drawFront(g);         // спинка кресла, растение, виньетка

  ctx.restore();
}

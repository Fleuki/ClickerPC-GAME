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
import * as Lighting from './lighting.js';
import * as FX from './fx.js';

/* ---- координаты предметов на сцене (не баланс — только композиция) ---- */
export const LAYOUT = {
  floorY:    612,
  /* top — переднее ребро столешницы, depth — её видимая глубина.
     Всё, что лежит на столе, живёт в полосе top-depth .. top. */
  desk:      { x0:150, x1:870, top:452, depth:44, thick:20, legW:18 },
  monitor:   { cx:400, base:418 },
  tower:     { x:700, y:190, w:124, h:236 },
  keyboard:  { cx:400, y:430, w:236, h:28 },
  mouse:     { cx:570, y:444 },
  headphones:{ cx:660, y:428 },   /* в просвете между правым экраном и корпусом */
  figurines: { x:270, y:424 },
  lamp:      { x:190, y:424 },    /* слева: справа лампа лезла на системник */
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

/* Куда прилетает коробка курьера при покупке и что «выпрыгивает» после.
   Для железа это корпус: процессор и блок питания живут внутри него. */
export function anchor(id){
  const L = LAYOUT;
  switch(id){
    case 'monitor':    return { x: L.monitor.cx, y: L.monitor.base - 90 };
    case 'keyboard':   return { x: L.keyboard.cx, y: L.keyboard.y + L.keyboard.h / 2 };
    case 'mouse':      return { x: L.mouse.cx, y: L.mouse.y };
    case 'headphones': return { x: L.headphones.cx, y: L.headphones.y - 44 };
    case 'furniture':  return { x: L.desk.x0 + (L.desk.x1 - L.desk.x0) / 2, y: L.desk.top - 10 };
    case 'ac':         return { x: L.ac.x + L.ac.w / 2, y: L.ac.y + L.ac.h };
    case 'decor':      return { x: L.figurines.x + 30, y: L.figurines.y - 14 };
    case 'rgb':        return { x: L.lamp.x + 40, y: L.lamp.y - 90 };
    default:           return { x: L.tower.x + L.tower.w / 2, y: L.tower.y + L.tower.h / 2 };
  }
}

/* Подстройка качества под реальное время кадра (см. lighting.js). */
export function tuneQuality(frameMs){ Lighting.tune(frameMs); }

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
    lvl:  id => state.levels[id] || 0,
    /* Обёртка «выпрыгивания» предмета после доставки: масштаб 1.25 -> 1.0
       вокруг точки (ax, ay). ids — одна категория или несколько. */
    withPop(ids, ax, ay, fn){
      const k = FX.popScale(ids);
      if(k === 1){ fn(); return; }
      ctx.save();
      ctx.translate(ax, ay);
      ctx.scale(k, k);
      ctx.translate(-ax, -ay);
      fn();
      ctx.restore();
    }
  };

  /* Порядок = глубина сцены, от дальнего к ближнему. Столешница идёт
     до предметов, её передний торец — после: тогда клавиатура и мышь
     лежат на поверхности и чуть уходят за ребро. */
  Room.drawBack(g);            // стена, окно, настенный декор, кондиционер, подсветка
  Desk.drawSurface(g);         // столешница
  Peripherals.drawDeskDecor(g);// фигурки и кот в глубине стола
  Monitor.draw(g);             // мониторы
  Tower.draw(g);               // системник и всё, что внутри
  Peripherals.draw(g);         // клавиатура, мышь, наушники, лампа
  Desk.drawFront(g);           // переднее ребро стола и ножки — поверх периферии
  Lighting.drawMonitorLight(g);// свет от монитора на стол и стену
  Room.drawHeat(g);            // волны жара и всполохи перегрева
  FX.draw(g);                  // частицы, числа, индикатор серии
  Room.drawFront(g);           // спинка кресла, растение, виньетка

  ctx.restore();

  /* Постобработка идёт в экранных координатах, поверх готового кадра:
     bloom одним проходом, температура сцены, ночь, зерно. */
  Lighting.toneFromState(state, state.levels.monitor || 0);
  Lighting.sampleMonitor(canvas, deviceRect(Monitor.screenRect(g)));
  Lighting.post(ctx, canvas, state, view);
}

/* Прямоугольник сцены -> пиксели холста, с обрезкой по его границам. */
function deviceRect(r){
  const k = view.scale * view.dpr;
  const x = (r.x * view.scale + view.ox) * view.dpr;
  const y = (r.y * view.scale + view.oy) * view.dpr;
  const x0 = Math.max(0, Math.min(canvas.width, x));
  const y0 = Math.max(0, Math.min(canvas.height, y));
  const x1 = Math.max(0, Math.min(canvas.width, x + r.w * k));
  const y1 = Math.max(0, Math.min(canvas.height, y + r.h * k));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/* Комната: стена, пол, окно, настенный декор, кондиционер, подсветка,
   волны жара, передний план. */

import { HEAT, DUST } from '../../config.js';
import { clamp } from '../../economy.js';

const WALL  = ['#23252e', '#242733', '#232839', '#1e2740'];
const FLOOR = ['#0f1014', '#111219', '#12141d', '#131725'];

/* Общий «класс» комнаты: по лучшей из комнатных категорий. */
function roomTier(g){
  return Math.max(g.vs('furniture'), g.vs('rgb'), g.vs('decor'));
}

export function drawBack(g){
  const { ctx, L, view } = g;
  const R = roomTier(g);

  /* стена и пол тянутся за границы сцены — на любом экране нет пустых полей */
  const grad = ctx.createLinearGradient(0, view.y0, 0, L.floorY);
  grad.addColorStop(0, WALL[R]);
  grad.addColorStop(1, '#15161d');
  ctx.fillStyle = grad;
  ctx.fillRect(view.x0, view.y0, view.x1 - view.x0, L.floorY - view.y0);

  ctx.fillStyle = FLOOR[R];
  ctx.fillRect(view.x0, L.floorY, view.x1 - view.x0, view.y1 - L.floorY);
  ctx.fillStyle = 'rgba(255,255,255,.05)';
  ctx.fillRect(view.x0, L.floorY, view.x1 - view.x0, 2);

  if(R >= 2) drawWindow(g);
  drawWallDecor(g);
  drawAc(g);
  drawLighting(g);
}

/* ---- окно в город --------------------------------------------------- */
function drawWindow(g){
  const { ctx, L, t } = g;
  const { x, y, w, h } = L.window;
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, '#0b1030');
  sky.addColorStop(1, '#2a1a44');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);

  for(let i = 0; i < 24; i++){
    const sx = x + ((i * 67) % w), sy = y + ((i * 41) % (h * 0.5));
    ctx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(t * 1.4 + i));
    ctx.fillStyle = '#cfe0ff';
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.globalAlpha = 1;

  for(let i = 0; i < 7; i++){
    const bw = 18 + ((i * 13) % 16), bh = 32 + ((i * 29) % 58), bx = x + 4 + i * 25;
    if(bx + bw > x + w) continue;
    ctx.fillStyle = '#0a0d1c';
    ctx.fillRect(bx, y + h - bh, bw, bh);
    for(let k = 0; k < 5; k++){
      if((i * 7 + k * 3) % 4) continue;
      ctx.fillStyle = k % 2 ? '#ffd76a' : '#7fd8ff';
      ctx.fillRect(bx + 4 + (k % 2) * 8, y + h - bh + 6 + k * 9, 4, 5);
    }
  }
  ctx.strokeStyle = '#0d1018'; ctx.lineWidth = 8;
  ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h);
  ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();
  g.glow(x + w / 2, y + h / 2, 160, 'rgba(90,120,255,.35)', 0.5);
}

/* ---- декор на стене: постер -> полка -> неон -> стена коллекционера --- */
function drawWallDecor(g){
  const { ctx, L, t } = g;
  const D = g.vs('decor');
  if(D === 0) return;
  const { x, y, w, h } = L.poster;

  ctx.fillStyle = '#171a22'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#2b3245'; ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
  ctx.fillStyle = '#ff5f7e';
  ctx.beginPath(); ctx.arc(x + w / 2, y + h * 0.33, w * 0.24, 0, 7); ctx.fill();
  ctx.fillStyle = '#4aa3ff'; ctx.fillRect(x + 14, y + h * 0.6, w - 40, 8);
  ctx.fillStyle = '#3ddc8a'; ctx.fillRect(x + 14, y + h * 0.6 + 15, w - 62, 8);

  if(D >= 2){                                   // неоновая вывеска
    const c = g.hue(t * 0.6, 200);
    ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 4, y + h + 26);
    ctx.quadraticCurveTo(x + w / 2, y + h + 4, x + w + 4, y + h + 26);
    ctx.stroke();
    ctx.lineCap = 'butt';
    g.glow(x + w / 2, y + h + 20, 90, 'rgba(255,90,200,.5)', 0.55);
  }
  if(D >= 3){                                   // аквариум на тумбе
    const ax = x - 6, ay = y + h + 50, aw = w + 12, ah = 74;
    ctx.fillStyle = '#101725'; g.rr(ax, ay, aw, ah, 6); ctx.fill();
    ctx.fillStyle = 'rgba(60,150,220,.45)'; g.rr(ax + 4, ay + 4, aw - 8, ah - 8, 4); ctx.fill();
    for(let i = 0; i < 4; i++){
      const fx = ax + 12 + ((i * 37) % (aw - 26));
      const fy = ay + 16 + ((i * 23) % (ah - 32)) + Math.sin(t * 1.6 + i) * 5;
      ctx.fillStyle = i % 2 ? '#ffd76a' : '#ff9f3d';
      ctx.beginPath(); ctx.ellipse(fx, fy, 5, 3, 0, 0, 7); ctx.fill();
    }
    g.glow(ax + aw / 2, ay + ah / 2, 80, 'rgba(80,180,255,.4)', 0.5);
  }
}

/* ---- кондиционер ---------------------------------------------------- */
function drawAc(g){
  const { ctx, L, t } = g;
  const A = g.vs('ac');
  if(A === 0) return;
  const { x, y, w, h } = L.ac;
  const unitW = A === 1 ? w * 0.7 : w;
  const unitH = A === 1 ? h * 0.72 : h;

  ctx.fillStyle = '#e8ebf0'; g.rr(x, y, unitW, unitH, 8); ctx.fill();
  ctx.fillStyle = '#cfd5dd'; g.rr(x + 6, y + unitH - 16, unitW - 12, 10, 4); ctx.fill();
  ctx.fillStyle = '#9aa3ad';
  for(let i = 0; i < 5; i++) ctx.fillRect(x + 10, y + 12 + i * 7, unitW - 20, 3);

  ctx.fillStyle = A >= 3 ? '#3ddc8a' : '#4aa3ff';
  ctx.beginPath(); ctx.arc(x + unitW - 14, y + unitH - 11, 3, 0, 7); ctx.fill();

  /* поток холодного воздуха */
  ctx.strokeStyle = 'rgba(140,210,255,.35)'; ctx.lineWidth = 2;
  for(let i = 0; i < A + 1; i++){
    ctx.beginPath();
    const sx = x + 18 + i * (unitW - 36) / Math.max(1, A);
    for(let k = 0; k < 40; k += 4){
      const px = sx + Math.sin((k + t * 150 + i * 30) * 0.08) * 6;
      k === 0 ? ctx.moveTo(px, y + unitH + k) : ctx.lineTo(px, y + unitH + k);
    }
    ctx.stroke();
  }
  if(A >= 2) g.glow(x + unitW / 2, y + unitH + 20, 120, 'rgba(120,200,255,.35)', 0.45);
}

/* ---- подсветка комнаты ---------------------------------------------- */
function drawLighting(g){
  const { ctx, L, t } = g;
  const R = g.vs('rgb');
  if(R === 0) return;

  if(R === 1){                                  // одноцветная лента за столом
    g.glow(L.desk.x0 + 120, L.desk.top - 40, 190, 'rgba(90,130,255,.6)', 0.42);
    g.glow(L.desk.x1 - 140, L.desk.top - 40, 190, 'rgba(255,70,170,.5)', 0.38);
    return;
  }
  /* панели на стене, дышат в такт */
  const n = R === 2 ? 3 : 5;
  for(let i = 0; i < n; i++){
    const px = L.desk.x0 + 40 + i * (L.desk.x1 - L.desk.x0 - 80) / (n - 1);
    const c = g.hue(t * (R === 3 ? 1.6 : 0.8), i * 64);
    const a = 0.32 + 0.14 * Math.sin(t * 2 + i);
    g.glow(px, L.desk.top - 70, R === 3 ? 230 : 170, c, a);
  }
  if(R === 3){                                  // заливка всей комнаты
    ctx.globalAlpha = 0.07 + 0.03 * Math.sin(t * 1.5);
    ctx.fillStyle = g.hue(t * 1.2, 0);
    ctx.fillRect(g.view.x0, g.view.y0, g.view.x1 - g.view.x0, g.view.y1 - g.view.y0);
    ctx.globalAlpha = 1;
  }
}

/* ---- жар и перегрев -------------------------------------------------- */
export function drawHeat(g){
  const { ctx, state, L, t } = g;
  const zoneStart = HEAT.zones[HEAT.zones.length - 1].from;
  if(state.heat >= zoneStart * 0.6){
    const a = clamp((state.heat - zoneStart * 0.6) / (HEAT.throttleIn - zoneStart * 0.6), 0, 1);
    ctx.strokeStyle = `rgba(255,140,80,${a * 0.5})`;
    ctx.lineWidth = 2;
    for(let i = 0; i < 4; i++){
      ctx.beginPath();
      for(let k = 0; k < 46; k += 4){
        const px = L.tower.x + 24 + i * (L.tower.w - 48) / 3 + Math.sin((k + t * 130 + i * 40) * 0.09) * 5;
        k === 0 ? ctx.moveTo(px, L.tower.y - 6 - k) : ctx.lineTo(px, L.tower.y - 6 - k);
      }
      ctx.stroke();
    }
  }
  if(state.throttling){
    ctx.globalAlpha = 0.10 + Math.sin(t * 8) * 0.06;
    ctx.fillStyle = '#ff2a1a';
    ctx.fillRect(g.view.x0, g.view.y0, g.view.x1 - g.view.x0, g.view.y1 - g.view.y0);
    ctx.globalAlpha = 1;
  }
}

/* ---- передний план --------------------------------------------------- */
export function drawFront(g){
  const { ctx, L, view } = g;
  drawPlant(g);
  drawChair(g);

  /* виньетка */
  const cx = (view.x0 + view.x1) / 2, cy = (view.y0 + view.y1) / 2;
  const v = ctx.createRadialGradient(cx, cy, 200, cx, cy, 620);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = v;
  ctx.fillRect(view.x0, view.y0, view.x1 - view.x0, view.y1 - view.y0);
}

const CHAIR = ['#33343c', '#3a3b45', '#2f3a4a', '#2a3550'];

function drawChair(g){
  const { ctx, L } = g;
  const F = g.vs('furniture');
  const cx = L.chair.cx, top = L.chair.top;
  const w = 230 + F * 14, h = 700 - top + 30;

  ctx.fillStyle = 'rgba(0,0,0,.35)';
  g.rr(cx - w / 2 - 6, top + 10, w + 12, h, 30); ctx.fill();
  ctx.fillStyle = CHAIR[F];
  g.rr(cx - w / 2, top, w, h, 26); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.06)';
  g.rr(cx - w / 2 + 16, top + 14, w - 32, h - 20, 20); ctx.fill();
  if(F >= 2){
    ctx.fillStyle = F >= 3 ? 'rgba(120,160,255,.55)' : 'rgba(255,90,140,.45)';
    ctx.fillRect(cx - w / 2 + 16, top + 14, w - 32, 5);
  }
  if(F >= 3){                                   // подголовник
    ctx.fillStyle = CHAIR[F];
    g.rr(cx - 62, top - 26, 124, 34, 14); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.07)';
    g.rr(cx - 52, top - 20, 104, 22, 10); ctx.fill();
  }
}

function drawPlant(g){
  const { ctx, L, t } = g;
  if(g.vs('decor') < 2) return;
  const bx = L.plant.x, by = L.plant.y;
  ctx.fillStyle = '#7a4a35';
  ctx.beginPath();
  ctx.moveTo(bx, by - 44); ctx.lineTo(bx + 54, by - 44);
  ctx.lineTo(bx + 44, by); ctx.lineTo(bx + 10, by);
  ctx.fill();
  ctx.strokeStyle = '#2f7d4f'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  for(let i = 0; i < 5; i++){
    const a = -Math.PI / 2 + (i - 2) * 0.42 + Math.sin(t * 0.8 + i) * 0.05;
    ctx.beginPath();
    ctx.moveTo(bx + 27, by - 44);
    ctx.quadraticCurveTo(bx + 27 + Math.cos(a) * 34, by - 92, bx + 27 + Math.cos(a) * 62, by - 128);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
}

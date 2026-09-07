/* Частицы, всплывающие числа, тряска камеры, индикатор серии, подсказка.
   Только оформление: ни одно число отсюда не влияет на экономику. */

import { t, fmt, fmtMult } from '../i18n.js';
import { comboMult } from '../economy.js';
import { windowLeft } from '../systems/combo.js';
import { COMBO, DELIVERY } from '../config.js';

const MAX_PARTS = 60;
const parts = [];
let shakeAmount = 0;
let flash = 0;
const lastClick = { x: 0, y: 0, active: false };

/* ---- доставка покупки (§7) ------------------------------------------
   Коробка падает сверху, подпрыгивает, раскрывается, вспышка — и предмет
   выпрыгивает с масштаба 1.25. Это главная награда игры, поэтому она
   заметная, а не мгновенная подмена картинки.
--------------------------------------------------------------------- */
const TOTAL = DELIVERY.fall + DELIVERY.bounce + DELIVERY.open + DELIVERY.pop;
let delivery = null;          // { id, x, y, time }
const motes = [];             // пылинки в луче лампы

export function reset(){
  parts.length = 0;
  motes.length = 0;
  shakeAmount = 0;
  flash = 0;
  delivery = null;
  lastClick.active = false;
}

export function deliver(id, at){
  delivery = { id, x: at.x, y: at.y, time: 0 };
}

/* Масштаб «выпрыгивания» для категории (или списка категорий). */
export function popScale(ids){
  if(!delivery) return 1;
  const list = Array.isArray(ids) ? ids : [ids];
  if(!list.includes(delivery.id)) return 1;
  const tPop = delivery.time - (DELIVERY.fall + DELIVERY.bounce + DELIVERY.open);
  if(tPop < 0 || tPop > DELIVERY.pop) return 1;
  const k = tPop / DELIVERY.pop;
  /* от overshoot к единице, с затухающим откатом */
  return 1 + (DELIVERY.overshoot - 1) * (1 - k) * Math.cos(k * Math.PI * 1.5);
}

/* Всплывающее число над местом клика. */
export function pop(x, y, value, crit){
  lastClick.x = x; lastClick.y = y; lastClick.active = true;
  if(parts.length >= MAX_PARTS) parts.shift();
  parts.push({
    kind: 'text', x, y, crit,
    vx: (Math.random() - 0.5) * 26,
    vy: -38 - Math.random() * 22,
    life: 1,
    txt: '+' + fmt(value)
  });
  coins(x, y, crit ? 5 : 2);
  if(crit) sparks(x, y);
}

/* Монетки, вылетающие из места клика. */
function coins(x, y, n){
  for(let i = 0; i < n && parts.length < MAX_PARTS; i++){
    parts.push({
      kind: 'coin', x, y,
      vx: (Math.random() - 0.5) * 110,
      vy: -70 - Math.random() * 70,
      life: 0.85
    });
  }
}

function sparks(x, y){
  for(let i = 0; i < 8 && parts.length < MAX_PARTS; i++){
    const a = Math.random() * Math.PI * 2;
    parts.push({
      kind: 'spark', x, y,
      vx: Math.cos(a) * (60 + Math.random() * 90),
      vy: Math.sin(a) * (60 + Math.random() * 90),
      life: 0.7
    });
  }
}

/* Облачко пыли при протирании. */
export function dustPuff(x, y){
  for(let i = 0; i < 7 && parts.length < MAX_PARTS; i++){
    const a = Math.random() * Math.PI * 2;
    parts.push({
      kind: 'dust', x, y,
      vx: Math.cos(a) * 40, vy: Math.sin(a) * 40 - 20,
      life: 0.9
    });
  }
}

/* Конфетти при переезде (§7). */
export function confetti(x, y){
  for(let i = 0; i < 40 && parts.length < MAX_PARTS + 40; i++){
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
    const v = 160 + Math.random() * 220;
    parts.push({
      kind: 'confetti', x, y,
      vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      hue: Math.floor(Math.random() * 360),
      spin: (Math.random() - 0.5) * 12,
      rot: Math.random() * 6,
      life: 1.6
    });
  }
  flash = 1;
  shake(9);
}

export function shake(amount){ shakeAmount = Math.max(shakeAmount, amount); }
export function purchaseFlash(){ flash = 1; shake(7); }

export function shakeOffset(){
  if(shakeAmount <= 0) return { x: 0, y: 0 };
  return {
    x: (Math.random() - 0.5) * shakeAmount,
    y: (Math.random() - 0.5) * shakeAmount
  };
}

export function update(dt){
  shakeAmount = Math.max(0, shakeAmount - dt * 14);
  flash = Math.max(0, flash - dt * 2.4);

  if(delivery){
    const was = delivery.time;
    delivery.time += dt;
    /* удар о стол и вспышка при раскрытии */
    const land = DELIVERY.fall;
    const open = DELIVERY.fall + DELIVERY.bounce;
    if(was < land && delivery.time >= land) shake(5);
    if(was < open && delivery.time >= open){ flash = 1; shake(7); }
    if(delivery.time > TOTAL) delivery = null;
  }

  for(const m of motes){
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    m.life -= dt * 0.18;
    if(m.life <= 0){ m.life = 1; m.x = m.x0 + (Math.random() - 0.5) * 120; m.y = m.y0 + Math.random() * 90; }
  }
  for(let i = parts.length - 1; i >= 0; i--){
    const p = parts[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += (p.kind === 'text' ? 48 : p.kind === 'coin' ? 260 :
             p.kind === 'confetti' ? 300 : 180) * dt;
    if(p.kind === 'confetti'){ p.rot += p.spin * dt; p.vx *= 0.985; }
    p.life -= dt * (p.kind === 'text' ? 1.1 : p.kind === 'coin' ? 1.2 :
                    p.kind === 'confetti' ? 0.55 : 1.6);
    if(p.life <= 0) parts.splice(i, 1);
  }
}

export function draw(g){
  const { ctx, state, view } = g;

  if(flash > 0){
    ctx.globalAlpha = flash * 0.22;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(view.x0, view.y0, view.x1 - view.x0, view.y1 - view.y0);
    ctx.globalAlpha = 1;
  }

  ctx.textAlign = 'center';
  for(const p of parts){
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    if(p.kind === 'text'){
      ctx.fillStyle = p.crit ? '#ff7ad4' : '#ffd76a';
      ctx.font = (p.crit ? 'bold 27px ' : '600 19px ') + 'system-ui,sans-serif';
      ctx.fillText(p.txt, p.x, p.y);
    }else if(p.kind === 'confetti'){
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = `hsl(${p.hue} 85% 62%)`;
      ctx.fillRect(-4, -6, 8, 12);
      ctx.restore();
    }else if(p.kind === 'coin'){
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 4, 4.6, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.beginPath();
      ctx.ellipse(p.x - 1, p.y - 1.4, 1.4, 1.8, 0, 0, 7);
      ctx.fill();
    }else{
      ctx.fillStyle = p.kind === 'dust' ? '#b0a179' : '#ffd76a';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.kind === 'dust' ? 5 : 3, 0, 7);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  drawMotes(g);
  drawDelivery(g);
  drawCombo(g);
  drawHint(g);
}

/* Пылинки в луче настольной лампы — появляются вместе с ней. */
function drawMotes(g){
  const { ctx, L } = g;
  if(g.vs('rgb') < 1) return;
  const bx = L.lamp.x + 46, by = L.lamp.y - 96;
  if(!motes.length){
    for(let i = 0; i < 14; i++){
      motes.push({
        x0: bx, y0: by,
        x: bx + (Math.random() - 0.5) * 120,
        y: by + Math.random() * 90,
        vx: (Math.random() - 0.5) * 7,
        vy: -3 - Math.random() * 5,
        life: Math.random()
      });
    }
  }
  ctx.fillStyle = '#ffd9a0';
  for(const m of motes){
    ctx.globalAlpha = Math.sin(Math.min(1, m.life) * Math.PI) * 0.5;
    ctx.beginPath();
    ctx.arc(m.x, m.y, 1.8, 0, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* Коробка курьера. */
function drawDelivery(g){
  if(!delivery) return;
  const { ctx } = g;
  const tt = delivery.time;
  const x = delivery.x;
  let y, squash = 1, lid = 0, alpha = 1;

  if(tt < DELIVERY.fall){                         // падение с ускорением
    const k = tt / DELIVERY.fall;
    y = delivery.y - 420 * (1 - k * k);
  }else if(tt < DELIVERY.fall + DELIVERY.bounce){ // подскок и сплющивание
    const k = (tt - DELIVERY.fall) / DELIVERY.bounce;
    y = delivery.y - Math.sin(k * Math.PI) * 26;
    squash = 1 - Math.sin(k * Math.PI) * 0.18;
  }else{                                          // раскрытие и растворение
    const k = Math.min(1, (tt - DELIVERY.fall - DELIVERY.bounce) / DELIVERY.open);
    y = delivery.y;
    lid = k;
    alpha = 1 - Math.max(0, (tt - DELIVERY.fall - DELIVERY.bounce - DELIVERY.open * 0.6)
      / (DELIVERY.open * 0.4 + DELIVERY.pop));
  }
  if(alpha <= 0) return;

  const w = 66, h = 48 * squash;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

  ctx.fillStyle = 'rgba(0,0,0,.35)';             // тень
  ctx.beginPath();
  ctx.ellipse(x, delivery.y + 6, w * 0.5, 7, 0, 0, 7);
  ctx.fill();

  ctx.fillStyle = '#a9793f';                     // короб
  g.rr(x - w / 2, y - h, w, h, 4); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.fillRect(x - w / 2, y - h * 0.45, w, 4);
  ctx.strokeStyle = '#d9b184'; ctx.lineWidth = 3; // скотч
  ctx.beginPath();
  ctx.moveTo(x, y - h); ctx.lineTo(x, y);
  ctx.stroke();

  for(const dir of [-1, 1]){                     // створки
    ctx.save();
    ctx.translate(x + dir * w / 2, y - h);
    ctx.rotate(dir * lid * 1.5);
    ctx.fillStyle = '#c08a4a';
    ctx.fillRect(dir < 0 ? 0 : -w / 2, -7, w / 2, 7);
    ctx.restore();
  }
  ctx.restore();

  if(lid > 0) g.glow(x, y - h * 0.7, 120, 'rgba(255,225,160,.7)', 0.5 * (1 - lid) + 0.2);
}

/* Индикатор серии рядом с местом клика. */
function drawCombo(g){
  const { ctx, state } = g;
  if(state.combo < 2 || !lastClick.active) return;
  const x = lastClick.x, y = lastClick.y - 44;
  const share = Math.min(1, state.combo / COMBO.maxCombo);

  ctx.globalAlpha = 0.9;
  ctx.fillStyle = 'rgba(12,14,20,.72)';
  g.rr(x - 34, y - 17, 68, 26, 13); ctx.fill();
  ctx.strokeStyle = share >= 1 ? '#ff7ad4' : '#3ddc8a';
  ctx.lineWidth = 2;
  g.rr(x - 34, y - 17, 68, 26, 13); ctx.stroke();

  ctx.fillStyle = share >= 1 ? '#ff7ad4' : '#e8ecf5';
  ctx.font = 'bold 15px system-ui,sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(t('scene.combo', { v: fmtMult(comboMult(state.combo)) }), x, y + 2);

  /* остаток окна серии */
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  g.rr(x - 28, y + 8, 56, 3, 2); ctx.fill();
  ctx.fillStyle = share >= 1 ? '#ff7ad4' : '#3ddc8a';
  g.rr(x - 28, y + 8, 56 * windowLeft(state), 3, 2); ctx.fill();
  ctx.globalAlpha = 1;
}

function drawHint(g){
  const { ctx, state, L, t: time } = g;
  if(state.seenIntro) return;
  ctx.globalAlpha = 0.55 + Math.sin(time * 4) * 0.3;
  ctx.fillStyle = '#e8ecf5';
  ctx.font = '600 24px system-ui,sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(t('scene.tapHint'), L.monitor.cx, L.floorY + 52);
  ctx.globalAlpha = 1;
}

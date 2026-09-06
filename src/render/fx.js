/* Частицы, всплывающие числа, тряска камеры, индикатор серии, подсказка.
   Только оформление: ни одно число отсюда не влияет на экономику. */

import { t, fmt, fmtMult } from '../i18n.js';
import { comboMult } from '../economy.js';
import { windowLeft } from '../systems/combo.js';
import { COMBO } from '../config.js';

const MAX_PARTS = 60;
const parts = [];
let shakeAmount = 0;
let flash = 0;
const lastClick = { x: 0, y: 0, active: false };

export function reset(){
  parts.length = 0;
  shakeAmount = 0;
  flash = 0;
  lastClick.active = false;
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
  if(crit) sparks(x, y);
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
  for(let i = parts.length - 1; i >= 0; i--){
    const p = parts[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += (p.kind === 'text' ? 48 : 180) * dt;
    p.life -= dt * (p.kind === 'text' ? 1.1 : 1.6);
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
    }else{
      ctx.fillStyle = p.kind === 'dust' ? '#b0a179' : '#ffd76a';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.kind === 'dust' ? 5 : 3, 0, 7);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  drawCombo(g);
  drawHint(g);
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

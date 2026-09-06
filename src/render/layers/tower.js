/* Системник и всё, что в нём: процессор, видеокарта, память, накопитель,
   блок питания, охлаждение. Плюс пыльные зоны для мини-действия чистки. */

import { HEAT, DUST } from '../../config.js';
import { clamp } from '../../economy.js';

/* Класс корпуса выводим из внутренностей: отдельной категории «корпус» нет,
   но сборка должна выглядеть дороже по мере апгрейдов. */
function caseTier(g){
  return Math.max(g.vs('cpu'), g.vs('gpu'), g.vs('psu'));
}

export function draw(g){
  const { ctx, state, L, t } = g;
  const T = L.tower;
  const C = caseTier(g);

  ctx.fillStyle = 'rgba(0,0,0,.45)';
  ctx.beginPath();
  ctx.ellipse(T.x + T.w / 2, T.y + T.h + 3, T.w * 0.5, 7, 0, 0, 7);
  ctx.fill();

  if(C === 0) drawBeigeBox(g);
  else drawModernCase(g, C);

  drawHeatTint(g);
  drawDust(g);
}

/* ---- вид A: бежевый офисный ящик ------------------------------------ */
function drawBeigeBox(g){
  const { ctx, state, L, t } = g;
  const T = L.tower;
  ctx.fillStyle = '#c9bfa2'; ctx.fillRect(T.x + 8, T.y + 26, T.w - 16, T.h - 26);
  ctx.fillStyle = '#b3a98d'; ctx.fillRect(T.x + 16, T.y + 40, T.w - 32, 30);
  ctx.fillStyle = '#8d846c';
  for(let i = 0; i < 7; i++) ctx.fillRect(T.x + 18, T.y + 100 + i * 9, T.w - 36, 4);
  ctx.fillStyle = state.throttling ? '#ff4d4d' : '#7ee08a';
  ctx.fillRect(T.x + 18, T.y + 84, 8, 5);
  /* индикатор накопителя мигает вместе с работой */
  if(g.lvl('ssd') > 0 && Math.floor(t * 6) % 2){
    ctx.fillStyle = '#ffd76a';
    ctx.fillRect(T.x + 32, T.y + 84, 5, 5);
  }
}

/* ---- виды B..D: корпус со стеклом ------------------------------------ */
function drawModernCase(g, C){
  const { ctx, state, L, t } = g;
  const T = L.tower;

  ctx.fillStyle = '#14161d'; g.rr(T.x, T.y, T.w, T.h, 8); ctx.fill();
  ctx.strokeStyle = C >= 2 ? '#3a4356' : '#262b36';
  ctx.lineWidth = 2; g.rr(T.x, T.y, T.w, T.h, 8); ctx.stroke();

  ctx.save();
  g.rr(T.x + 7, T.y + 8, T.w - 14, T.h - 16, 5);
  ctx.clip();
  ctx.fillStyle = '#0b0d13';
  ctx.fillRect(T.x, T.y, T.w, T.h);

  drawPsu(g);
  drawGpu(g);
  drawRam(g);
  drawCooling(g);
  drawStorage(g);

  ctx.restore();

  /* стекло */
  ctx.strokeStyle = 'rgba(180,220,255,.18)'; ctx.lineWidth = 2;
  g.rr(T.x + 7, T.y + 8, T.w - 14, T.h - 16, 5); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.05)';
  ctx.beginPath();
  ctx.moveTo(T.x + 14, T.y + 16); ctx.lineTo(T.x + 50, T.y + 16);
  ctx.lineTo(T.x + 18, T.y + T.h - 26); ctx.lineTo(T.x + 10, T.y + T.h - 26);
  ctx.fill();

  ctx.fillStyle = state.throttling ? '#ff4d4d' : '#3ddc8a';
  ctx.beginPath(); ctx.arc(T.x + T.w - 15, T.y + 18, 3.5, 0, 7); ctx.fill();

  g.glow(T.x + T.w / 2, T.y + T.h / 2, 130,
    state.throttling ? 'rgba(255,60,40,.5)' : 'rgba(90,170,255,.35)', 0.5);
}

/* ---- блок питания: шрауд снизу, чем мощнее, тем солиднее ------------- */
function drawPsu(g){
  const { ctx, L } = g;
  const T = L.tower, P = g.vs('psu');
  const h = 30 + P * 4;
  ctx.fillStyle = '#171b24';
  ctx.fillRect(T.x + 8, T.y + T.h - h - 10, T.w - 16, h);
  ctx.fillStyle = '#0d1017';
  ctx.beginPath();
  ctx.arc(T.x + 30, T.y + T.h - h / 2 - 10, 11, 0, 7);
  ctx.fill();
  ctx.strokeStyle = P >= 2 ? '#ffd76a' : '#3a4356';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(T.x + 30, T.y + T.h - h / 2 - 10, 11, 0, 7);
  ctx.stroke();
  ctx.fillStyle = '#2a3040';
  for(let i = 0; i < 3 + P; i++){
    ctx.fillRect(T.x + 50 + i * 7, T.y + T.h - h - 4, 4, h - 8);
  }
}

/* ---- видеокарта ------------------------------------------------------ */
function drawGpu(g){
  const { ctx, L, t, state } = g;
  const T = L.tower, G = g.vs('gpu');
  if(g.lvl('gpu') === 0) return;                // встроенная графика не видна
  const y = T.y + T.h - 96;
  const h = 20 + G * 5;
  ctx.fillStyle = '#1c2130';
  ctx.fillRect(T.x + 30, y, T.w - 40, h);
  ctx.fillStyle = '#12151f';
  ctx.fillRect(T.x + 30, y + h, T.w - 40, 5);
  const c = G >= 2 ? g.hue(t, 120) : '#4aa3ff';
  ctx.fillStyle = c;
  ctx.fillRect(T.x + 34, y + 4, T.w - 48, 4);
  if(G >= 1){                                   // вентиляторы на карте
    for(let i = 0; i < Math.min(3, G + 1); i++){
      fan(g, T.x + 44 + i * 26, y + h / 2 + 2, 9, t * (2 + G), c);
    }
  }
  if(G >= 3){                                   // вторая карта
    ctx.fillStyle = '#1c2130';
    ctx.fillRect(T.x + 30, y - 34, T.w - 40, h - 4);
    ctx.fillStyle = g.hue(t, 260);
    ctx.fillRect(T.x + 34, y - 30, T.w - 48, 4);
  }
  g.glow(T.x + T.w / 2, y + h / 2, 70, state.throttling ? 'rgba(255,70,40,.5)' : 'rgba(90,170,255,.4)', 0.45);
}

/* ---- оперативка: планки с подсветкой --------------------------------- */
function drawRam(g){
  const { ctx, L, t } = g;
  const T = L.tower, R = g.lvl('ram');
  const n = Math.min(4, Math.ceil(R / 2) + 1);
  for(let i = 0; i < n; i++){
    const x = T.x + 62 + i * 9;
    ctx.fillStyle = '#232a38';
    ctx.fillRect(x, T.y + 40, 6, 46);
    if(R >= 3){
      ctx.fillStyle = g.hue(t * 1.4, i * 40 + 60);
      ctx.fillRect(x, T.y + 40, 6, 5);
    }
  }
}

/* ---- накопитель: диск с индикатором ---------------------------------- */
function drawStorage(g){
  const { ctx, L, t } = g;
  const T = L.tower, S = g.vs('ssd');
  const x = T.x + T.w - 34, y = T.y + 96;
  ctx.fillStyle = '#1a1f2a';
  g.rr(x, y, 24, 14 + S * 2, 3); ctx.fill();
  ctx.fillStyle = Math.floor(t * 7) % 2 ? '#ffd76a' : '#4a5164';
  ctx.fillRect(x + 3, y + 3, 4, 3);
  if(S >= 2){                                   // второй накопитель / массив
    ctx.fillStyle = '#1a1f2a';
    g.rr(x, y + 22 + S * 2, 24, 14, 3); ctx.fill();
    ctx.fillStyle = '#3ddc8a';
    ctx.fillRect(x + 3, y + 25 + S * 2, 4, 3);
  }
}

/* ---- охлаждение: башни, вентиляторы, водянка -------------------------- */
function drawCooling(g){
  const { ctx, L, t } = g;
  const T = L.tower, C = g.vs('cooler'), lvl = g.lvl('cooler');
  const speed = 2 + lvl * 0.7;

  if(C <= 1){                                   // воздух: башня и корпусные вертушки
    ctx.fillStyle = '#2a3040';
    ctx.fillRect(T.x + 34, T.y + 34, 26, 52);
    ctx.fillStyle = '#3a4356';
    for(let i = 0; i < 8; i++) ctx.fillRect(T.x + 34, T.y + 36 + i * 6, 26, 2);
    fan(g, T.x + 47, T.y + 30, 12, t * speed, '#6fe0ff');
    if(C === 1) fan(g, T.x + 24, T.y + 118, 12, t * speed + 1, '#6fe0ff');
  }else{                                        // жидкость: радиатор и контур
    ctx.strokeStyle = C >= 3 ? '#3ddc8a' : '#6fe0ff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(T.x + 48, T.y + 96);
    ctx.bezierCurveTo(T.x + 96, T.y + 74, T.x + 88, T.y + 36, T.x + 54, T.y + 26);
    ctx.stroke();
    ctx.fillStyle = 'rgba(61,220,138,.45)';
    ctx.fillRect(T.x + 84, T.y + 34, 12, 56);
    ctx.fillStyle = '#1a1f2a';
    g.rr(T.x + 34, T.y + 86, 34, 24, 4); ctx.fill();
    ctx.strokeStyle = g.hue(t, 180); ctx.lineWidth = 2;
    g.rr(T.x + 37, T.y + 89, 28, 18, 3); ctx.stroke();
    const n = C === 2 ? 2 : 3;
    for(let i = 0; i < n; i++) fan(g, T.x + 26 + i * 30, T.y + 24, 12, t * speed + i, g.hue(t, i * 70));
  }
}

function fan(g, cx, cy, r, a, color){
  const { ctx } = g;
  ctx.fillStyle = '#0a0c12';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(a);
  ctx.fillStyle = '#2a3040';
  for(let i = 0; i < 7; i++){
    ctx.rotate(Math.PI * 2 / 7);
    ctx.beginPath();
    ctx.ellipse(r * 0.55, 0, r * 0.42, r * 0.16, 0.5, 0, 7);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = color; ctx.lineWidth = 2.2;
  ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.arc(cx, cy, r - 1, 0, 7); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#161a24';
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.28, 0, 7); ctx.fill();
}

/* ---- красное свечение корпуса при нагреве ---------------------------- */
function drawHeatTint(g){
  const { ctx, state, L } = g;
  const from = HEAT.zones[HEAT.zones.length - 1].from * 0.7;
  if(state.heat <= from) return;
  const T = L.tower;
  ctx.globalAlpha = clamp((state.heat - from) / (HEAT.max - from), 0, 1) * 0.42;
  ctx.fillStyle = '#ff3a1a';
  g.rr(T.x, T.y, T.w, T.h, 8); ctx.fill();
  ctx.globalAlpha = 1;
}

/* ---- пыль ------------------------------------------------------------- */
function drawDust(g){
  const { ctx, state, L, t } = g;
  const T = L.tower;

  if(state.cleaning){
    for(const s of state.cleaning.spots){
      if(s.done) continue;
      const x = T.x + s.x * T.w, y = T.y + s.y * T.h, r = s.r * T.w;
      ctx.globalAlpha = 0.55 + 0.2 * Math.sin(t * 5 + s.x * 10);
      ctx.fillStyle = '#b0a179';
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = '#ffd76a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, r + 3, 0, 7); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    return;
  }
  if(state.dust < DUST.showFrom) return;
  ctx.globalAlpha = clamp((state.dust - DUST.showFrom) / (DUST.max - DUST.showFrom), 0, 1) * 0.4;
  ctx.fillStyle = '#b0a179';
  for(let i = 0; i < 7; i++){
    const x = T.x + 12 + ((i * 53) % (T.w - 30));
    const y = T.y + 20 + ((i * 71) % (T.h - 44));
    ctx.beginPath(); ctx.arc(x, y, 7 + (i % 3) * 3, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

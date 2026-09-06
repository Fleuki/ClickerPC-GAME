/* Клавиатура, мышь, наушники, лампа и мелочь на столе. */

export function draw(g){
  drawKeyboard(g);
  drawMouse(g);
  drawHeadphones(g);
  drawLamp(g);
}

/* ---- декор на столе рисуется до корпуса ------------------------------ */
export function drawDeskDecor(g){
  const D = g.vs('decor');
  if(D >= 1) drawFigurines(g);
  /* Кот появляется с 3 уровня декора (§5). В фазе 1 — только украшение,
     механика кота относится к фазе 3. */
  if(g.lvl('decor') >= 3) drawCat(g);
}

/* ---- клавиатура ------------------------------------------------------ */
function drawKeyboard(g){
  const { ctx, L, t } = g;
  const K = g.vs('keyboard'), lvl = g.lvl('keyboard');
  const k = L.keyboard;
  const x = k.cx - k.w / 2, y = k.y, w = k.w, h = k.h;

  ctx.fillStyle = 'rgba(0,0,0,.35)'; g.rr(x + 4, y + 8, w, h, 5); ctx.fill();
  ctx.fillStyle = K === 0 ? '#8f8f96' : '#1a1d25';
  g.rr(x, y, w, h, 5); ctx.fill();
  if(K >= 2){                                   // алюминиевая рама кастома
    ctx.strokeStyle = '#4a5164'; ctx.lineWidth = 2;
    g.rr(x + 1, y + 1, w - 2, h - 2, 5); ctx.stroke();
  }

  const cols = 15, kw = (w - 14) / cols;
  for(let r = 0; r < 3; r++){
    for(let i = 0; i < cols; i++){
      const kx = x + 7 + i * kw, ky = y + 5 + r * 7;
      if(K === 0)      ctx.fillStyle = '#cfcfd4';
      else if(K === 1) ctx.fillStyle = 'rgba(200,220,255,.6)';
      else if(K === 2) ctx.fillStyle = `rgba(110,200,255,${0.45 + 0.4 * Math.sin(t * 3 + i * 0.4)})`;
      else             ctx.fillStyle = g.hue(t * 2.2, i * 17 + r * 12);
      ctx.fillRect(kx, ky, kw - 2.5, 5);
    }
  }
  if(K >= 2) g.glow(k.cx, y + h / 2, 150, K >= 3 ? 'rgba(255,90,200,.4)' : 'rgba(90,190,255,.4)', 0.45);
  if(K >= 3){                                   // подставка под запястья
    ctx.fillStyle = '#242833';
    g.rr(x + 10, y + h + 3, w - 20, 8, 4); ctx.fill();
  }
  /* макросы работают — бегущий огонёк по ряду */
  if(lvl >= 1){
    const i = Math.floor(t * 8) % cols;
    ctx.fillStyle = '#ffd76a';
    ctx.fillRect(x + 7 + i * kw, y + h - 8, kw - 2.5, 4);
  }
}

/* ---- мышь ------------------------------------------------------------ */
function drawMouse(g){
  const { ctx, L, t } = g;
  const M = g.vs('mouse');
  const cx = L.mouse.cx, cy = L.mouse.y;

  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.beginPath(); ctx.ellipse(cx + 3, cy + 8, 20, 8, 0, 0, 7); ctx.fill();
  ctx.fillStyle = M === 0 ? '#9a9aa2' : '#1c1f28';
  ctx.beginPath(); ctx.ellipse(cx, cy, 18, 13, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx, cy - 13); ctx.lineTo(cx, cy - 2); ctx.stroke();

  if(M === 1){ ctx.fillStyle = '#ff4d4d'; ctx.fillRect(cx - 3, cy - 6, 6, 3); }
  if(M >= 2){
    ctx.strokeStyle = g.hue(t * (M >= 3 ? 2.6 : 1.3), 200);
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(cx, cy, 18, 13, 0, 0, 7); ctx.stroke();
    g.glow(cx, cy, 74, 'rgba(255,80,200,.45)', 0.4);
  }
  if(M === 0){                                  // провод к системнику
    ctx.strokeStyle = '#5a5f6b'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 12);
    ctx.quadraticCurveTo(cx + 60, cy - 46, L.tower.x + 10, L.tower.y + L.tower.h - 30);
    ctx.stroke();
  }
  if(M >= 2){                                   // коврик
    ctx.fillStyle = '#232936';
    g.rr(cx - 30, cy + 8, 60, 8, 4); ctx.fill();
  }
}

/* ---- наушники на стойке ---------------------------------------------- */
function drawHeadphones(g){
  const { ctx, L, t } = g;
  const H = g.vs('headphones');
  const cx = L.headphones.cx, base = L.headphones.y;

  ctx.fillStyle = '#2e3444';
  ctx.beginPath(); ctx.ellipse(cx, base + 2, 20, 6, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#3c4252'; ctx.fillRect(cx - 3, base - 54, 6, 54);

  const cup = 9 + H * 2.5;
  ctx.strokeStyle = H === 0 ? '#8f8f96' : '#3c4252';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, base - 54, 20 + H * 2, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = H === 0 ? '#9a9aa2' : '#2b3140';
  for(const dir of [-1, 1]){
    ctx.beginPath();
    ctx.ellipse(cx + dir * (20 + H * 2), base - 50, cup * 0.6, cup, 0, 0, 7);
    ctx.fill();
  }
  if(H >= 2){
    ctx.strokeStyle = g.hue(t * 1.1, 40); ctx.lineWidth = 2;
    for(const dir of [-1, 1]){
      ctx.beginPath();
      ctx.ellipse(cx + dir * (20 + H * 2), base - 50, cup * 0.6, cup, 0, 0, 7);
      ctx.stroke();
    }
    g.glow(cx, base - 50, 66, 'rgba(255,180,90,.35)', 0.4);
  }
}

/* ---- лампа ----------------------------------------------------------- */
function drawLamp(g){
  const { ctx, L } = g;
  if(g.vs('rgb') < 1) return;
  const x = L.lamp.x, y = L.lamp.y;
  ctx.fillStyle = '#2e3444';
  ctx.beginPath(); ctx.ellipse(x, y, 20, 6, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#3c4252'; ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y - 6); ctx.lineTo(x, y - 96); ctx.lineTo(x - 44, y - 116);
  ctx.stroke();
  ctx.fillStyle = '#4a5164';
  ctx.beginPath();
  ctx.moveTo(x - 66, y - 112); ctx.lineTo(x - 32, y - 126);
  ctx.lineTo(x - 22, y - 102); ctx.lineTo(x - 56, y - 88);
  ctx.fill();
  g.glow(x - 46, y - 88, 140, 'rgba(255,214,140,.55)', 0.5);
}

/* ---- фигурки и кот ---------------------------------------------------- */
function drawFigurines(g){
  const { ctx, L } = g;
  const D = g.vs('decor');
  const x = L.figurines.x, y = L.figurines.y;
  const colors = ['#ff5f7e', '#4aa3ff', '#3ddc8a', '#ffd76a'];
  for(let i = 0; i < 1 + D; i++){
    const fx = x + i * 20;
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath(); ctx.arc(fx, y - 20, 6, 0, 7); ctx.fill();
    ctx.fillRect(fx - 5, y - 14, 10, 14);
  }
}

function drawCat(g){
  const { ctx, L, t } = g;
  const x = L.figurines.x + 84, y = L.desk.top;
  const breathe = Math.sin(t * 1.2) * 1.2;

  ctx.fillStyle = '#3b3a44';
  ctx.beginPath();
  ctx.ellipse(x, y - 12 + breathe, 30, 12, 0, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - 26, y - 20 + breathe, 11, 0, 7);
  ctx.fill();
  ctx.beginPath();                              // уши
  ctx.moveTo(x - 34, y - 28 + breathe); ctx.lineTo(x - 30, y - 40 + breathe);
  ctx.lineTo(x - 24, y - 29 + breathe); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 24, y - 29 + breathe); ctx.lineTo(x - 18, y - 39 + breathe);
  ctx.lineTo(x - 15, y - 27 + breathe); ctx.fill();
  ctx.strokeStyle = '#3b3a44'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath();                              // хвост
  ctx.moveTo(x + 28, y - 12);
  ctx.quadraticCurveTo(x + 46, y - 20 + Math.sin(t * 2) * 6, x + 40, y - 30);
  ctx.stroke();
  ctx.lineCap = 'butt';
}

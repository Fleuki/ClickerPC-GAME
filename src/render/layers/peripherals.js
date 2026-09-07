/* Клавиатура, мышь, наушники, лампа и мелочь на столе. */

export function draw(g){
  const L = g.L;
  g.withPop('keyboard',   L.keyboard.cx, L.keyboard.y + L.keyboard.h, () => drawKeyboard(g));
  g.withPop('mouse',      L.mouse.cx, L.mouse.y + 13, () => drawMouse(g));
  g.withPop('headphones', L.headphones.cx, L.headphones.y, () => drawHeadphones(g));
  g.withPop('rgb',        L.lamp.x, L.lamp.y, () => drawLamp(g));
}

/* ---- декор на столе рисуется до корпуса ------------------------------ */
export function drawDeskDecor(g){
  if(g.vs('decor') < 1) return;
  const L = g.L;
  g.withPop('decor', L.figurines.x, L.figurines.y, () => drawFigurines(g));
}

/* Кот рисуется после клавиатуры: сидя на ней, он должен её закрывать. */
export function drawCat(g, pos){
  const { ctx, state, t } = g;
  const c = state.cat;
  if(!c || !pos) return;

  const onKeys = c.mode === 'keyboard';
  const walking = c.mode === 'walk';
  const breathe = Math.sin(t * 1.6) * 1.3;
  const step = walking ? Math.sin(t * 7) * 2.5 : 0;
  const x = pos.x, y = pos.y + (onKeys ? -6 : 0);
  const face = c.dir;

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.beginPath(); ctx.ellipse(x, y + 4, 30, 7, 0, 0, 7); ctx.fill();

  const petting = c.petLeft > 0;
  ctx.fillStyle = petting ? '#4a4654' : '#3b3a44';

  if(onKeys){                                   // разлёгся поперёк клавиш
    ctx.beginPath(); ctx.ellipse(x, y - 10 + breathe, 36, 12, 0, 0, 7); ctx.fill();
  }else{
    ctx.beginPath();
    ctx.ellipse(x, y - 14 + breathe, 26, walking ? 12 : 14, 0, 0, 7);
    ctx.fill();
    for(const off of [-14, 10]){                // лапы
      ctx.fillRect(x + off, y - 6, 6, 8 + (walking ? step * (off < 0 ? 1 : -1) : 0));
    }
  }

  const hx = x - face * 26, hy = y - (onKeys ? 18 : 26) + breathe;
  ctx.beginPath(); ctx.arc(hx, hy, 12, 0, 7); ctx.fill();
  ctx.beginPath();                              // уши
  ctx.moveTo(hx - 9, hy - 7); ctx.lineTo(hx - 5, hy - 20); ctx.lineTo(hx + 2, hy - 8); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(hx + 2, hy - 8); ctx.lineTo(hx + 9, hy - 19); ctx.lineTo(hx + 11, hy - 5); ctx.fill();

  if(!onKeys){                                  // глаза, когда не спит
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath(); ctx.arc(hx - face * 4, hy - 1, 2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(hx - face * 10, hy - 1, 2, 0, 7); ctx.fill();
  }

  ctx.strokeStyle = petting ? '#4a4654' : '#3b3a44';
  ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath();                              // хвост
  ctx.moveTo(x + face * 24, y - 12);
  ctx.quadraticCurveTo(x + face * 44, y - 22 + Math.sin(t * 2.4) * 8, x + face * 36, y - 34);
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.restore();

  if(onKeys){                                   // «зззз»
    ctx.globalAlpha = 0.55 + Math.sin(t * 3) * 0.25;
    ctx.fillStyle = '#e8ecf5';
    ctx.font = '600 15px system-ui,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('z z', x + face * -30, y - 40 + Math.sin(t * 1.5) * 3);
    ctx.globalAlpha = 1;
  }
  if(petting) g.glow(x, y - 20, 90, 'rgba(255,190,120,.5)', 0.45);
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
  /* макросы работают — бегущий огонёк по ряду; под котом они стоят */
  const catOnKeys = g.state.cat && g.state.cat.mode === 'keyboard';
  if(lvl >= 1 && !catOnKeys){
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
    ctx.quadraticCurveTo(cx + 70, cy - 30, L.tower.x + 8, L.tower.y + L.tower.h - 24);
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
  ctx.moveTo(x, y - 6); ctx.lineTo(x, y - 96); ctx.lineTo(x + 44, y - 116);
  ctx.stroke();
  ctx.fillStyle = '#4a5164';
  ctx.beginPath();
  ctx.moveTo(x + 66, y - 112); ctx.lineTo(x + 32, y - 126);
  ctx.lineTo(x + 22, y - 102); ctx.lineTo(x + 56, y - 88);
  ctx.fill();
  g.glow(x + 46, y - 88, 140, 'rgba(255,214,140,.55)', 0.5);
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


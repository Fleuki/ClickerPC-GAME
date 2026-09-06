/* Мониторы и живой экран: баланс, полоса рендера, столбики нагрузки,
   «Перегрев» при троттлинге. */

import { t, fmt, fmtMult } from '../../i18n.js';
import { HEAT } from '../../config.js';

/* ширина/высота основного экрана по визуальному состоянию */
const SW = [208, 250, 322, 300];
const SH = [156, 142, 152, 168];

/* Прямоугольник светящейся части экрана в координатах сцены.
   Освещение усредняет по нему цвет, чтобы свет от монитора шёл «по кадру». */
export function screenRect(g){
  const M = g.vs('monitor');
  const cx = g.L.monitor.cx, base = g.L.monitor.base;
  const w = SW[M], h = SH[M];
  if(M === 0) return { x: cx - w / 2 + 22, y: base - 26 - h + 18, w: w - 44, h: h - 48 };
  const bez = M === 1 ? 8 : 4;
  return { x: cx - w / 2 + bez, y: base - 26 - h + bez, w: w - bez * 2, h: h - bez * 2 };
}

export function draw(g){
  g.withPop('monitor', g.L.monitor.cx, g.L.monitor.base, () => drawAll(g));
}

function drawAll(g){
  const { ctx, L, t: time } = g;
  const M = g.vs('monitor');
  const cx = L.monitor.cx, base = L.monitor.base;

  if(M === 0){ drawCrt(g, cx, base); return; }

  if(M === 3){
    /* Боковые экраны стоят под углом через ctx.transform, а скос смещает их
       по x примерно на 0.13*y. Позиции заданы уже с поправкой на это,
       иначе правый экран налезает на системник. */
    side(g, cx - 232, base - 160, 112, 122, time, -1);
    side(g, cx + 116, base - 160, 112, 122, time, 1);
  }

  const w = SW[M], h = SH[M];
  const x = cx - w / 2, y = base - 26 - h;

  ctx.fillStyle = '#20242e'; ctx.fillRect(cx - 48, base - 28, 96, 10);   // подставка
  ctx.fillStyle = '#2a2f3a'; ctx.fillRect(cx - 10, y + h, 20, base - 28 - (y + h));

  const bez = M === 1 ? 8 : 4;
  ctx.fillStyle = '#0d0f15'; g.rr(x, y, w, h, 6); ctx.fill();
  screen(g, x + bez, y + bez, w - bez * 2, h - bez * 2, M, time);

  if(M >= 2){
    g.glow(cx, y + h / 2, 240,
      g.state.throttling ? 'rgba(255,70,40,.45)' : 'rgba(90,150,255,.4)', 0.45);
  }
}

/* ---- ЭЛТ ------------------------------------------------------------- */
function drawCrt(g, cx, base){
  const { ctx, t: time } = g;
  const w = SW[0], h = SH[0];
  ctx.fillStyle = '#3a3a3f'; ctx.fillRect(cx - 58, base - 26, 116, 26);
  ctx.fillStyle = '#c9bfa2'; g.rr(cx - w / 2, base - 26 - h, w, h, 10); ctx.fill();
  ctx.fillStyle = '#b0a68a'; g.rr(cx - w / 2 + 12, base - 26 - h + 10, w - 24, h - 32, 8); ctx.fill();
  screen(g, cx - w / 2 + 22, base - 26 - h + 18, w - 44, h - 48, 0, time);
}

function side(g, x, y, w, h, time, dir){
  const { ctx } = g;
  ctx.save();
  ctx.transform(1, 0, dir * 0.13, 1, 0, 0);
  ctx.fillStyle = '#0d0f15'; g.rr(x, y, w, h, 5); ctx.fill();
  screen(g, x + 4, y + 4, w - 8, h - 8, 2, time + dir);
  ctx.restore();
}

/* ---- содержимое экрана ------------------------------------------------ */
function screen(g, x, y, w, h, M, time){
  const { ctx, state } = g;
  ctx.save();
  g.rr(x, y, w, h, 3); ctx.clip();

  if(M === 0){
    ctx.fillStyle = '#0b1c10'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#59e08a';
    ctx.font = '13px ui-monospace,monospace';
    ctx.textAlign = 'left';
    ctx.fillText('C:\\> job.exe', x + 10, y + 22);
    ctx.font = 'bold 20px ui-monospace,monospace';
    ctx.fillText(fmt(state.money), x + 10, y + 52);
    ctx.font = '13px ui-monospace,monospace';
    ctx.fillText(state.throttling ? t('scene.throttle')
      : (Math.floor(time * 2) % 2 ? '_' : ''), x + 10, y + 76);
    ctx.globalAlpha = 0.13; ctx.fillStyle = '#000';
    for(let i = 0; i < h; i += 3) ctx.fillRect(x, y + i, w, 1);
    ctx.globalAlpha = 1;
  }else{
    const bg = ctx.createLinearGradient(x, y, x + w, y + h);
    bg.addColorStop(0, '#101a33');
    bg.addColorStop(1, '#1d1030');
    ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.font = '11px system-ui,sans-serif';
    ctx.fillText(t('scene.screenTitle'), x + 10, y + 18);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 21px system-ui,sans-serif';
    ctx.fillText(t('scene.screenMoney', { v: fmt(state.money) }), x + 10, y + 42);

    const pw = w - 20, p = (time * 0.45) % 1;
    ctx.fillStyle = 'rgba(255,255,255,.12)'; g.rr(x + 10, y + 52, pw, 7, 4); ctx.fill();
    ctx.fillStyle = state.throttling ? '#ff4d4d' : '#4aa3ff';
    g.rr(x + 10, y + 52, pw * p, 7, 4); ctx.fill();

    const n = Math.floor(pw / 13);
    for(let i = 0; i < n; i++){
      const v = (Math.sin(time * 3 + i * 0.7) * 0.5 + 0.5) * (h - 84) + 6;
      ctx.fillStyle = i > n - 4 ? '#ff7ad4' : 'rgba(120,200,255,.7)';
      ctx.fillRect(x + 10 + i * 13, y + h - 10 - v, 8, v);
    }

    if(state.throttling){
      ctx.fillStyle = `rgba(255,60,40,${0.25 + Math.sin(time * 9) * 0.2})`;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t('scene.throttle'), x + w / 2, y + h / 2 + 6);
    }else if(state.boost.left > 0){
      ctx.fillStyle = '#ffb43d';
      ctx.font = 'bold 13px system-ui,sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(t('scene.boost', { v: fmtMult(HEAT.boost.income) }), x + w - 10, y + 20);
    }
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,.08)';
  ctx.lineWidth = 1;
  g.rr(x, y, w, h, 3); ctx.stroke();
}

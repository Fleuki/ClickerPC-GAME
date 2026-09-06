/* =====================================================================
   Освещение и постобработка (§7).

   Свет от монитора  — аддитивный градиент на стол и стену, цвет берётся
                       усреднением того, что реально нарисовано на экране.
   Bloom             — один проход: уменьшенная копия кадра, размытие
                       ctx.filter и наложение композицией lighter.
   Зерно             — шумовая текстура 128x128, тайл поверх кадра.
   Температура сцены — вся палитра уезжает в красный при нагреве
                       и в синий на холодной системе.
   День и ночь       — общее затемнение комнаты по фазе суток.

   Здесь нет ни одного числа: все параметры лежат в config.LIGHT.
===================================================================== */

import { LIGHT, HEAT } from '../config.js';
import { clamp, daylight } from '../economy.js';

/* ---- офскрины ------------------------------------------------------- */
let bloom = null;          // { canvas, ctx, w, h }
let sampler = null;        // холст 1x1 для усреднения цвета экрана
let grain = null;          // шумовая текстура
let grainPattern = null;

/* Переключатели проходов: используются автонастройкой качества и замерами. */
export const passes = { bloom: true, tint: true, grain: true, sample: true };

/* ---- автонастройка качества -----------------------------------------
   Полнокадровые проходы упираются не в размер размытия, а в само копирование
   кадра: замеры показали, что 1/4, 1/8 и 1/16 стоят одинаково. Значит
   единственный честный рычаг — выключать проход целиком там, где железо
   не тянет. Игра меряет своё же время отрисовки и подстраивается сама.
--------------------------------------------------------------------- */
export const quality = { level: 2, auto: true };
let qAcc = 0, qCount = 0, qCooldown = 0, qWarm = 0;

function applyLevel(l){
  quality.level = Math.max(0, Math.min(2, l));
  passes.bloom  = quality.level >= 2;
  passes.sample = quality.level >= 1;
  passes.grain  = quality.level >= 1;
  passes.tint   = true;                     // тон почти бесплатный, он остаётся
}
export function setQuality(l){ quality.auto = false; applyLevel(l); }

/* Качество только снижается и никогда не поднимается само.

   Обратный ход выглядит логично, но приводит к качелям: на уровне 1 кадр
   укладывается в бюджет, игра включает блум обратно, кадр снова вылезает,
   блум выключается — и так по кругу, с видимым миганием картинки. Железо
   по ходу сессии быстрее не становится, так что подниматься попросту
   некуда. Вернуть эффекты вручную можно через setQuality(). */
export function tune(frameMs){
  if(!quality.auto) return;
  if(qWarm < LIGHT.qualityWarmup){ qWarm += 1; return; }  // прогрев после загрузки
  qAcc += frameMs; qCount += 1;
  if(qCount < LIGHT.qualityWindow) return;
  const avg = qAcc / qCount;
  qAcc = 0; qCount = 0;
  if(qCooldown > 0){ qCooldown -= 1; return; }
  if(avg > LIGHT.frameBudget && quality.level > 0){
    applyLevel(quality.level - 1);
    qCooldown = LIGHT.qualityCooldown;
  }
}

let frame = 0;
/* сглаженный цвет свечения монитора */
const tone = { r: 90, g: 130, b: 220 };

function makeCanvas(w, h){
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/* Шум генерируется один раз за сессию. */
function ensureGrain(ctx){
  if(grainPattern) return grainPattern;
  const n = LIGHT.grainSize;
  grain = makeCanvas(n, n);
  const g = grain.getContext('2d');
  const img = g.createImageData(n, n);
  for(let i = 0; i < img.data.length; i += 4){
    const v = 110 + Math.random() * 90;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainPattern = ctx.createPattern(grain, 'repeat');
  return grainPattern;
}

function ensureBloom(w, h){
  const bw = Math.max(1, Math.round(w * LIGHT.bloomScale));
  const bh = Math.max(1, Math.round(h * LIGHT.bloomScale));
  if(!bloom || bloom.canvas.width !== bw || bloom.canvas.height !== bh){
    const canvas = makeCanvas(bw, bh);
    bloom = { canvas, ctx: canvas.getContext('2d'), w: bw, h: bh };
  }
  return bloom;
}

/* ---- цвет свечения монитора -----------------------------------------
   Раз в несколько кадров сжимаем область экрана в один пиксель: браузер
   усредняет её сам, читать нужно всего 4 байта. Берём кадр предыдущий —
   задержка в один кадр глазом не ловится, зато свет можно рисовать
   до самого монитора.
--------------------------------------------------------------------- */
export function sampleMonitor(mainCanvas, deviceRect){
  frame += 1;
  if(!passes.sample) return;
  if(frame % LIGHT.screenSampleEvery) return;
  if(deviceRect.w < 1 || deviceRect.h < 1) return;
  if(!sampler) sampler = makeCanvas(1, 1);
  const sctx = sampler.getContext('2d', { willReadFrequently: true });
  try{
    sctx.clearRect(0, 0, 1, 1);
    sctx.drawImage(mainCanvas, deviceRect.x, deviceRect.y, deviceRect.w, deviceRect.h, 0, 0, 1, 1);
    const d = sctx.getImageData(0, 0, 1, 1).data;
    const k = LIGHT.screenSmooth;
    tone.r += (d[0] - tone.r) * k;
    tone.g += (d[1] - tone.g) * k;
    tone.b += (d[2] - tone.b) * k;
  }catch(e){ /* холст «испачкан» — оставляем прошлый цвет */ }
}

/* Если сэмплирование выключено автонастройкой, цвет берём из состояния:
   у нас на экране либо зелёный ЭЛТ, либо сине-фиолетовый рендер,
   либо красный перегрев, либо оранжевый разгон. */
export function toneFromState(state, monitorLevel){
  if(passes.sample) return;
  let target;
  if(state.throttling)        target = [255, 90, 60];
  else if(state.boost.left>0) target = [255, 170, 70];
  else if(monitorLevel === 0) target = [90, 224, 138];
  else                        target = [110, 140, 235];
  const k = LIGHT.screenSmooth;
  tone.r += (target[0] - tone.r) * k;
  tone.g += (target[1] - tone.g) * k;
  tone.b += (target[2] - tone.b) * k;
}

export function monitorTone(){
  /* нормализуем яркость: важен оттенок, а не то, насколько тёмный кадр */
  const max = Math.max(tone.r, tone.g, tone.b, 1);
  const k = 255 / max;
  return {
    r: Math.round(clamp(tone.r * k, 0, 255)),
    g: Math.round(clamp(tone.g * k, 0, 255)),
    b: Math.round(clamp(tone.b * k, 0, 255))
  };
}

/* Свет от монитора на стол и стену. Рисуется до самого монитора. */
export function drawMonitorLight(g){
  const { L } = g;
  const c = monitorTone();
  const cx = L.monitor.cx, cy = L.monitor.base - 90;
  const rgba = a => `rgba(${c.r},${c.g},${c.b},${a})`;
  g.glow(cx, cy, LIGHT.monitorLightRadius, rgba(0.55), LIGHT.monitorLightAlpha);
  /* отражение на столешнице — вытянутое пятно */
  const { ctx } = g;
  ctx.save();
  ctx.translate(cx, L.desk.top - L.desk.depth * 0.4);
  ctx.scale(1, 0.28);
  g.glow(0, 0, LIGHT.monitorLightRadius * 0.7, rgba(0.6), LIGHT.monitorLightAlpha * 0.9);
  ctx.restore();
}

/* ---- постобработка: вызывается в экранных координатах ---------------- */
export function post(ctx, canvas, state, view){
  if(passes.bloom) bloomPass(ctx, canvas);
  if(passes.tint)  tintPass(ctx, canvas, state);
  if(passes.grain) grainPass(ctx, canvas);
}

/* Один проход блума.

   ctx.filter = 'blur()' по кадру оказался неподъёмным: замер показал
   +8..12 мс на кадр при бюджете 16. Тот же результат даёт связка
   «уменьшить — увеличить обратно»: билинейная фильтрация при масштабировании
   и есть размытие, только бесплатное. Размывающий фильтр остаётся
   необязательной добавкой на маленьком холсте (LIGHT.bloomBlur = 0 — выкл). */
function bloomPass(ctx, canvas){
  const b = ensureBloom(canvas.width, canvas.height);
  b.ctx.setTransform(1, 0, 0, 1, 0, 0);
  b.ctx.globalCompositeOperation = 'source-over';
  b.ctx.globalAlpha = 1;
  b.ctx.imageSmoothingEnabled = true;
  b.ctx.clearRect(0, 0, b.w, b.h);
  b.ctx.drawImage(canvas, 0, 0, b.w, b.h);

  /* Отсечка по яркости. Без неё lighter поднимает и полутона, и кадр
     затягивает дымкой. Умножение копии на саму себя возводит яркость
     в квадрат: 0.3 превращается в 0.09, а 0.9 — в 0.81, то есть тёмное
     гаснет, светящееся остаётся. Стоит один рисунок мелкого холста. */
  if(LIGHT.bloomThreshold){
    b.ctx.globalCompositeOperation = 'multiply';
    b.ctx.drawImage(b.canvas, 0, 0);
    b.ctx.globalCompositeOperation = 'source-over';
  }

  if(LIGHT.bloomBlur > 0){
    b.ctx.filter = `blur(${LIGHT.bloomBlur}px)`;
    b.ctx.drawImage(b.canvas, 0, 0);
    b.ctx.filter = 'none';
  }

  /* Тёмные места после сложения почти ничего не добавляют, светящиеся —
     дают ореол. Это и есть дешёвый bloom из §7. */
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = LIGHT.bloomAlpha;
  ctx.drawImage(b.canvas, 0, 0, canvas.width, canvas.height);
  ctx.restore();
}

/* Температура сцены и время суток одним слоем. */
function tintPass(ctx, canvas, state){
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  const warm = clamp((state.heat - HEAT.zones[1].from) /
                     (HEAT.max - HEAT.zones[1].from), 0, 1);
  const cold = clamp(1 - state.heat / HEAT.zones[1].from, 0, 1);

  if(warm > 0){
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = warm * LIGHT.tempTintMax;
    ctx.fillStyle = '#ff4a20';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }else if(cold > 0){
    ctx.globalAlpha = cold * LIGHT.coldTintMax;
    ctx.fillStyle = '#3a6cff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /* ночь: комната темнее, экран и подсветка начинают доминировать */
  const night = 1 - daylight(state);
  if(night > 0){
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 1;
    const v = Math.round(255 * (1 - night * LIGHT.nightDim));
    ctx.fillStyle = `rgb(${v},${v},${Math.min(255, v + 12)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.restore();
}

/* Зерно: убирает «пластиковость» плоских заливок. */
function grainPass(ctx, canvas){
  const pattern = ensureGrain(ctx);
  if(!pattern) return;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = LIGHT.grainAlpha;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

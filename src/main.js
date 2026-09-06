/* =====================================================================
   Цикл, инициализация, склейка.

   step() и applyManualClick() — чистая логика без DOM: их же импортирует
   tools/sim.js, поэтому симулятор гоняет ровно ту модель, что и игра.
   Всё, что трогает документ, живёт внутри boot() и вызывается только
   в браузере.
===================================================================== */

import { LOOP, SAVE, SCENE, ECONOMY, HEAT, UI, MAX_LEVEL } from './config.js';
import * as State from './state.js';
import * as Economy from './economy.js';
import * as HeatSys from './systems/heat.js';
import * as DustSys from './systems/dust.js';
import * as ComboSys from './systems/combo.js';
import { setLocale, locale } from './i18n.js';
import { sdk } from './platform/sdk.js';

/* ---------------------------------------------------------------------
   ЛОГИКА (общая с симулятором)
--------------------------------------------------------------------- */

/* Ручной клик. Возвращает { value, crit } — вызывающий решает, что показать. */
export function applyManualClick(state){
  ComboSys.registerClick(state);
  const crit = Math.random() < Economy.critChance(state.levels);
  const value = Economy.clickValue(state) * (crit ? ECONOMY.critMult : 1);
  state.money += value;
  state.earned += value;
  state.clicks += 1;
  state.seenIntro = true;
  HeatSys.addClickHeat(state, false);
  return { value, crit };
}

/* Один шаг симуляции. Возвращает сводку для эффектов. */
export function step(state, dt){
  state.playTime += dt;

  HeatSys.update(state, dt);
  DustSys.update(state, dt);
  ComboSys.update(state, dt);

  /* автоклики от клавиатуры: при троттлинге стоят */
  let autoClicks = 0, autoValue = 0;
  if(!state.throttling){
    const cps = Economy.autoCps(state);
    if(cps > 0){
      state.autoAcc += cps * dt;
      const budget = Math.ceil(cps * LOOP.maxFrameTime) + 1;   // защита от зависания
      while(state.autoAcc >= 1 && autoClicks < budget){
        state.autoAcc -= 1;
        const v = Economy.autoClickValue(state);
        state.money += v;
        state.earned += v;
        autoValue += v;
        autoClicks += 1;
        HeatSys.addClickHeat(state, true);
      }
      if(state.autoAcc > budget) state.autoAcc = 0;
    }
  }else{
    state.autoAcc = 0;
  }

  /* фоновый доход видеокарты */
  const passive = Economy.passiveIncome(state) * dt;
  state.money += passive;
  state.earned += passive;

  return { autoClicks, autoValue, passive };
}

/* Покупка уровня. Возвращает true, если покупка состоялась. */
export function buy(state, id){
  const check = Economy.purchaseCheck(state, id);
  if(!check.ok) return false;
  state.money -= check.price;
  state.levels[id] = Economy.levelOf(state.levels, id) + 1;
  return true;
}

/* ---------------------------------------------------------------------
   БРАУЗЕРНАЯ ЧАСТЬ
--------------------------------------------------------------------- */
const state = State.createState();

async function boot(){
  const [Scene, FX, Hud, Shop, Modals] = await Promise.all([
    import('./render/scene.js'),
    import('./render/fx.js'),
    import('./ui/hud.js'),
    import('./ui/shop.js'),
    import('./ui/modals.js')
  ]);

  await sdk.init();
  const saved = await sdk.storage.load(SAVE.key);
  if(saved) State.load(state, saved);
  setLocale(state.lang || sdk.language());
  document.documentElement.lang = locale();

  const canvas = document.getElementById('scene');
  Scene.init(canvas);

  Hud.init(document.getElementById('hud'), {
    onBoost: () => { if(HeatSys.startBoost(state)) FX.shake(4); },
    onClean: () => DustSys.start(state)
  });

  Shop.init(document.getElementById('tabs'), document.getElementById('shop'), {
    onBuy: id => {
      if(buy(state, id)){
        FX.purchaseFlash();
        Shop.update(state);
        save();
      }
    },
    onStats: () => Modals.stats(state),
    onReset: () => Modals.confirmReset(() => {
      State.reset(state);
      FX.reset();
      Shop.update(state);
      save();
    })
  });

  Modals.setLanguageHandler(code => {
    state.lang = setLocale(code);
    document.documentElement.lang = locale();
    Hud.applyLabels();
    Shop.applyLabels();
    Shop.update(state);
    save();
  });

  bindInput(canvas, Scene, FX, DustSys);
  bindResize(Scene);
  bindPersistence();

  /* игра интерактивна — сообщаем платформе */
  sdk.ready();

  let last = performance.now(), acc = 0, uiTick = 0;
  const drawTimes = [];

  function frame(now){
    let dt = (now - last) / 1000;
    last = now;
    if(dt > LOOP.maxFrameTime) dt = LOOP.maxFrameTime;

    acc += dt;
    let guard = 0;
    while(acc >= LOOP.fixedStep && guard++ < 8){
      const out = step(state, LOOP.fixedStep);
      acc -= LOOP.fixedStep;
      spawnAutoFx(out, FX, Scene);
    }
    FX.update(dt);

    const t0 = performance.now();
    Scene.draw(state, now / 1000, dt);
    const t1 = performance.now();
    if(drawTimes.length >= LOOP.perfWindow) drawTimes.shift();
    drawTimes.push(t1 - t0);

    /* интерфейс обновляем реже, чем рисуем кадр */
    uiTick += dt;
    if(uiTick >= LOOP.uiInterval){
      uiTick = 0;
      Hud.update(state);
      Shop.update(state);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* служебная ручка для проверок из консоли (см. README) */
  window.SETUP = {
    state,
    economy: Economy,
    perf(){
      if(!drawTimes.length) return null;
      const sum = drawTimes.reduce((a, b) => a + b, 0);
      return {
        frames: drawTimes.length,
        avgMs: +(sum / drawTimes.length).toFixed(3),
        maxMs: +Math.max(...drawTimes).toFixed(3)
      };
    },
    save,
    scene: Scene
  };

  /* ---- ввод ---- */
  function bindInput(canvas, Scene, FX, DustSys){
    canvas.addEventListener('pointerdown', e => {
      e.preventDefault();
      const p = Scene.toScene(e.clientX, e.clientY);

      /* сначала пробуем протереть пыль */
      if(state.cleaning){
        const T = Scene.towerRect();
        const nx = (p.x - T.x) / T.w, ny = (p.y - T.y) / T.h;
        if(DustSys.tap(state, nx, ny) >= 0){
          FX.dustPuff(p.x, p.y);
          FX.shake(3);
          return;
        }
      }
      const r = applyManualClick(state);
      FX.pop(p.x, p.y, r.value, r.crit);
      FX.shake(r.crit ? 6 : 2.5);
    });

    document.addEventListener('keydown', e => {
      if(e.code !== 'Space') return;
      e.preventDefault();
      const r = applyManualClick(state);
      FX.pop(Scene.LAYOUT.monitor.cx, Scene.LAYOUT.desk.top - 60, r.value, r.crit);
      FX.shake(r.crit ? 6 : 2.5);
    });

    /* страница не скроллится; прокрутка разрешена только внутри магазина */
    document.addEventListener('touchmove', e => {
      if(!e.target.closest || !e.target.closest('.shop')) e.preventDefault();
    }, { passive: false });
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('contextmenu', e => {
      if(e.target === canvas) e.preventDefault();
    });
  }

  function spawnAutoFx(out, FX, Scene){
    if(!out.autoClicks) return;
    /* показываем не каждый автоклик, иначе на высоких cps экран забьётся числами */
    if(Math.random() > UI.autoClickFxChance) return;
    const k = Scene.LAYOUT.keyboard;
    FX.pop(k.cx + (Math.random() - 0.5) * k.w, k.y - 20, out.autoValue, false);
  }

  function bindResize(Scene){
    const stage = document.querySelector('.stage');
    const relayout = () => Scene.resize();
    window.addEventListener('resize', relayout);
    window.addEventListener('orientationchange', relayout);
    if(window.ResizeObserver) new ResizeObserver(relayout).observe(stage);
  }

  function bindPersistence(){
    setInterval(save, SAVE.autosaveInterval * 1000);
    document.addEventListener('visibilitychange', () => { if(document.hidden) save(); });
    window.addEventListener('pagehide', save);
    window.addEventListener('beforeunload', save);
  }
}

function save(){ return sdk.storage.save(SAVE.key, State.serialize(state)); }

/* В node этот модуль импортируется ради step() — там документа нет. */
if(typeof document !== 'undefined'){
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}

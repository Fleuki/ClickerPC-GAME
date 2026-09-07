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
import * as OrdersSys from './systems/orders.js';
import * as CatSys from './systems/cat.js';
import * as PrestigeSys from './systems/prestige.js';
import * as OfflineSys from './systems/offline.js';
import * as Achievements from './systems/achievements.js';
import { setLocale, locale, t, fmt } from './i18n.js';
import { CAT, ORDERS, PRESTIGE, OFFLINE } from './config.js';
const OFFLINE_AD = OFFLINE.adMultiplier;
import { sdk } from './platform/sdk.js';
import * as Sound from './platform/sound.js';

/* ---------------------------------------------------------------------
   ЛОГИКА (общая с симулятором)
--------------------------------------------------------------------- */

/* Единственное место, где деньги прибавляются: earned — за текущий забег,
   totalEarned — за всё время, его не сбрасывает переезд. */
export function earn(state, value){
  state.money += value;
  state.earned += value;
  state.totalEarned += value;
}

/* Ручной клик. Возвращает { value, crit } — вызывающий решает, что показать. */
export function applyManualClick(state){
  ComboSys.registerClick(state);
  OrdersSys.registerClick(state);
  const crit = Math.random() < Economy.critChance(state.levels);
  const value = Economy.clickValue(state) * (crit ? ECONOMY.critMult : 1);
  earn(state, value);
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
  CatSys.update(state, dt);
  const orderEvent = OrdersSys.update(state, dt);

  /* достижения проверяем раз в секунду: считать там нечего, но и незачем */
  state.achTimer = (state.achTimer || 0) + dt;
  let unlocked = null;
  if(state.achTimer >= 1){
    state.achTimer = 0;
    const fresh = Achievements.check(state);
    if(fresh.length) unlocked = fresh;
  }

  /* автоклики от клавиатуры: стоят при троттлинге и когда кот сел на неё */
  let autoClicks = 0, autoValue = 0;
  if(!state.throttling && !CatSys.blocksAuto(state)){
    const cps = Economy.autoCps(state);
    if(cps > 0){
      state.autoAcc += cps * dt;
      const budget = Math.ceil(cps * LOOP.maxFrameTime) + 1;   // защита от зависания
      while(state.autoAcc >= 1 && autoClicks < budget){
        state.autoAcc -= 1;
        const v = Economy.autoClickValue(state);
        earn(state, v);
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
  earn(state, passive);

  return { autoClicks, autoValue, passive, orderEvent, unlocked };
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
  /* «пока тебя не было» считаем по времени из сейва, до первого кадра */
  const away = saved ? OfflineSys.collect(state, saved.savedAt, Date.now()) : null;
  Sound.setMuted(state.muted);
  setLocale(state.lang || sdk.language());
  document.documentElement.lang = locale();

  const canvas = document.getElementById('scene');
  Scene.init(canvas);

  Hud.init(document.getElementById('hud'), {
    onBoost: () => { if(HeatSys.startBoost(state)){ FX.shake(4); Sound.play('reward'); } },
    onClean: () => { if(DustSys.start(state)) Sound.play('clean'); },
    /* Мгновенная чистка за ролик (§4.4) — реклама, которую игрок просит сам. */
    onCleanAd: async () => {
      const watched = await sdk.rewarded();
      if(!watched){ Modals.toast(t('hud.adFailed'), 'bad'); return; }
      DustSys.cancel(state);
      state.dust = 0;
      state.cleans += 1;
      Sound.play('clean');
      FX.dustPuff(Scene.towerRect().x + Scene.towerRect().w / 2,
                  Scene.towerRect().y + Scene.towerRect().h / 2);
      save();
    },
    onMove: () => Modals.prestige(state, () => {
      const gain = PrestigeSys.move(state);
      if(!gain) return;
      FX.reset();
      FX.confetti(Scene.LAYOUT.monitor.cx, Scene.LAYOUT.desk.top - 120);
      Sound.play('prestige');
      Modals.toast(t('move.done', { loc: t('loc.' + state.location), r: gain }), 'gold');
      Shop.update(state);
      save();
      /* Переезд — естественная пауза, тут и место межстраничной.
         Частоту и задержку от старта сессии проверяет сам sdk. */
      sdk.interstitial();
    })
  });

  Shop.init(document.getElementById('tabs'), document.getElementById('shop'), {
    onBuy: id => {
      if(buy(state, id)){
        FX.deliver(id, Scene.anchor(id));
        Sound.play('buy');
        Shop.update(state);
        save();
      }else{
        Sound.play('denied');
      }
    },
    onStats: () => Modals.stats(state),
    onAchievements: () => Modals.achievements(state),
    onReset: () => Modals.confirmReset(() => {
      State.reset(state);
      FX.reset();
      Shop.update(state);
      save();
    })
  });

  Modals.setMuteHandler(() => {
    state.muted = Sound.setMuted(!state.muted);
    save();
  }, () => state.muted);

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

  if(away){
    Modals.offline(state, away,
      amount => { OfflineSys.grant(state, amount); save(); },
      async amount => {
        const watched = await sdk.rewarded();
        OfflineSys.grant(state, watched ? amount : amount / OFFLINE_AD);
        save();
      });
  }

  let last = performance.now(), acc = 0, uiTick = 0;
  let wasThrottling = state.throttling;
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
      handleEvents(out);
    }
    /* звук на переходах троттлинга — по факту смены состояния, не каждый кадр */
    if(state.throttling !== wasThrottling){
      Sound.play(state.throttling ? 'overheat' : 'cooled');
      wasThrottling = state.throttling;
    }
    FX.update(dt);

    const t0 = performance.now();
    Scene.draw(state, now / 1000, dt);
    const t1 = performance.now();
    Scene.tuneQuality(t1 - t0);
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
    scene: Scene,
    lighting: await import('./render/lighting.js'),
    config: await import('./config.js'),
    sound: Sound,
    perfReset(){ drawTimes.length = 0; },
    sdk
  };

  /* ---- ввод ---- */
  function bindInput(canvas, Scene, FX, DustSys){
    canvas.addEventListener('pointerdown', e => {
      e.preventDefault();
      Sound.unlock();                 // звук можно включать только по жесту
      const p = Scene.toScene(e.clientX, e.clientY);

      /* кот важнее всего: по нему кликают прицельно */
      const cat = Scene.catPos(state);
      if(cat){
        const dx = p.x - cat.x, dy = p.y - cat.y;
        if(dx * dx + dy * dy <= cat.r * cat.r){
          const what = CatSys.touch(state);
          if(what === 'pet'){
            Modals.toast(t('cat.pet', { p: Math.round(CAT.petBonus * 100) }), 'gold');
            Sound.play('reward');
            FX.shake(3);
            return;
          }
          if(what === 'shoo'){
            Modals.toast(t('cat.shoo'));
            FX.shake(4);
            return;
          }
        }
      }

      /* потом пробуем протереть пыль */
      if(state.cleaning){
        const T = Scene.towerRect();
        const nx = (p.x - T.x) / T.w, ny = (p.y - T.y) / T.h;
        const hit = DustSys.tap(state, nx, ny);
        if(hit >= 0){
          FX.dustPuff(p.x, p.y);
          FX.shake(3);
          Sound.play('clean', { spread: 0.2 });
          if(!state.cleaning) state.cleans += 1;   // протёр всё до конца
          return;
        }
      }
      const r = applyManualClick(state);
      FX.pop(p.x, p.y, r.value, r.crit);
      FX.shake(r.crit ? 6 : 2.5);
      r.crit ? Sound.crit() : Sound.click();
    });

    document.addEventListener('keydown', e => {
      if(e.code !== 'Space') return;
      e.preventDefault();
      Sound.unlock();
      const r = applyManualClick(state);
      FX.pop(Scene.LAYOUT.monitor.cx, Scene.LAYOUT.desk.top - 60, r.value, r.crit);
      FX.shake(r.crit ? 6 : 2.5);
      r.crit ? Sound.crit() : Sound.click();
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

  /* Заказы и достижения сообщают о себе всплывающим сообщением. */
  function handleEvents(out){
    if(out.orderEvent === 'done'){
      Modals.toast(t('order.done', { v: fmt(state.lastReward) }), 'good');
      Sound.play('reward');
      FX.confetti(Scene.LAYOUT.monitor.cx, Scene.LAYOUT.desk.top - 140);
    }else if(out.orderEvent === 'failed'){
      Modals.toast(t('order.failed'), 'bad');
    }
    if(out.unlocked){
      for(const id of out.unlocked){
        Modals.toast(t('ach.new', { v: t('ach.' + id) }), 'gold');
      }
    }
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
    document.addEventListener('visibilitychange', () => {
      sdk.gameplay(!document.hidden);   // платформа хочет знать, идёт ли игра
      if(document.hidden) save();
    });
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

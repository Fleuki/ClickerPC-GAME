/* =====================================================================
   Состояние игры, сериализация и миграции сейвов.
===================================================================== */

import { CATEGORIES, MAX_LEVEL, SAVE, HEAT, DUST } from './config.js';
import { clamp } from './economy.js';

export function createState(){
  const levels = {};
  for(const c of CATEGORIES) levels[c.id] = 0;
  return {
    money: 0,
    earned: 0,
    clicks: 0,
    levels,
    heat: 0,
    throttling: false,
    dust: 0,
    combo: 0,
    comboTimer: 0,
    boost: { left: 0, cooldown: 0 },
    reputation: 0,          // фаза 3
    playTime: 0,
    seenIntro: false,
    lang: null,             // выбранный игроком язык; null — берём у платформы
    /* транзиентное, не сохраняется */
    cleaning: null,
    autoAcc: 0
  };
}

/* ---- сериализация ---------------------------------------------------- */
export function serialize(state){
  return {
    version: SAVE.version,
    money: state.money,
    earned: state.earned,
    clicks: state.clicks,
    levels: { ...state.levels },
    heat: state.heat,
    throttling: state.throttling,
    dust: state.dust,
    combo: state.combo,
    comboTimer: state.comboTimer,
    boost: { left: state.boost.left, cooldown: state.boost.cooldown },
    reputation: state.reputation,
    playTime: state.playTime,
    seenIntro: state.seenIntro,
    lang: state.lang,
    savedAt: Date.now()
  };
}

/* ---- миграции --------------------------------------------------------
   Ключ — версия, из которой мигрируем. Функция поднимает данные на +1.
--------------------------------------------------------------------- */
const MIGRATIONS = {
  /* 1 -> 2: формат прототипа. Уровни лежали в `lvl` под другими именами,
     категорий было 6, пыли и комбо не существовало. */
  1(d){
    const old = d.lvl || {};
    const levels = {};
    levels.cpu        = old.pc    || 0;
    levels.gpu        = old.pc    || 0;
    levels.cooler     = old.cool  || 0;
    levels.mouse      = old.mouse || 0;
    levels.keyboard   = old.kb    || 0;
    levels.monitor    = old.mon   || 0;
    levels.furniture  = old.room  || 0;
    return {
      money: d.money, earned: d.earned, clicks: d.clicks,
      levels,
      heat: d.heat, throttling: d.throttle,
      dust: 0, combo: 0, comboTimer: 0,
      boost: { left: d.turbo || 0, cooldown: d.turboCd || 0 },
      reputation: 0, playTime: 0, seenIntro: !!d.firstClick, lang: null
    };
  }
};

export function migrate(raw){
  let data = { ...raw };
  let v = Math.floor(Number(data.version)) || 1;
  while(v < SAVE.version){
    if(MIGRATIONS[v]) data = MIGRATIONS[v](data);
    v += 1;
    data.version = v;
  }
  return data;
}

/* ---- загрузка --------------------------------------------------------
   Любое повреждённое или незнакомое поле заменяется дефолтом:
   сейв не должен ронять игру ни при каких данных.
--------------------------------------------------------------------- */
const num = (v, def, lo, hi) => {
  const n = Number(v);
  if(!Number.isFinite(n)) return def;
  return lo === undefined ? n : clamp(n, lo, hi);
};

export function load(state, raw){
  if(!raw || typeof raw !== 'object') return false;
  let d;
  try{ d = migrate(raw); }catch(e){ return false; }

  state.money   = num(d.money, 0, 0, Number.MAX_SAFE_INTEGER);
  state.earned  = num(d.earned, state.money, 0, Number.MAX_SAFE_INTEGER);
  state.clicks  = Math.floor(num(d.clicks, 0, 0, Number.MAX_SAFE_INTEGER));

  const lv = (d.levels && typeof d.levels === 'object') ? d.levels : {};
  for(const c of CATEGORIES){
    state.levels[c.id] = Math.floor(num(lv[c.id], 0, 0, MAX_LEVEL));
  }

  state.heat       = num(d.heat, 0, HEAT.min, HEAT.max);
  state.throttling = !!d.throttling;
  /* защита от рассинхрона: троттлинг не может «залипнуть» ниже порога выхода */
  if(state.throttling && state.heat < HEAT.throttleOut) state.throttling = false;

  state.dust       = num(d.dust, 0, 0, DUST.max);
  state.combo      = Math.floor(num(d.combo, 0, 0, Number.MAX_SAFE_INTEGER));
  state.comboTimer = num(d.comboTimer, 0, 0, Number.MAX_SAFE_INTEGER);
  if(state.comboTimer <= 0) state.combo = 0;

  const b = (d.boost && typeof d.boost === 'object') ? d.boost : {};
  state.boost.left     = num(b.left, 0, 0, HEAT.boost.duration);
  state.boost.cooldown = num(b.cooldown, 0, 0, HEAT.boost.cooldown);

  state.reputation = num(d.reputation, 0, 0, Number.MAX_SAFE_INTEGER);
  state.playTime   = num(d.playTime, 0, 0, Number.MAX_SAFE_INTEGER);
  state.seenIntro  = !!d.seenIntro;
  state.lang       = typeof d.lang === 'string' ? d.lang : null;

  state.cleaning = null;
  state.autoAcc = 0;
  return true;
}

export function reset(state){
  const fresh = createState();
  fresh.lang = state.lang;          // язык — настройка игрока, не прогресс
  Object.assign(state, fresh);
  state.levels = fresh.levels;
  return state;
}

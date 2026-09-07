/* =====================================================================
   Состояние игры, сериализация и миграции сейвов.
===================================================================== */

import { CATEGORIES, MAX_LEVEL, SAVE, HEAT, DUST, ORDERS, PRESTIGE, CAT } from './config.js';
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
    reputation: 0,
    location: 0,            // комната у родителей ... серверная
    moves: 0,               // сколько раз переезжал
    totalEarned: 0,         // за всё время, не сбрасывается переездом
    order: null,
    orderTimer: ORDERS.firstDelay,   // дать освоиться до первого клиента
    ordersDone: 0,
    cleans: 0,
    lastReward: 0,
    achievements: [],
    cat: null,
    playTime: 0,
    seenIntro: false,
    muted: false,
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
    location: state.location,
    moves: state.moves,
    totalEarned: state.totalEarned,
    order: state.order,
    orderTimer: state.orderTimer,
    ordersDone: state.ordersDone,
    cleans: state.cleans,
    achievements: state.achievements.slice(),
    cat: state.cat,
    playTime: state.playTime,
    seenIntro: state.seenIntro,
    muted: state.muted,
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
  state.location   = Math.floor(num(d.location, 0, 0, PRESTIGE.locations - 1));
  state.moves      = Math.floor(num(d.moves, 0, 0, Number.MAX_SAFE_INTEGER));
  state.totalEarned= num(d.totalEarned, state.earned, 0, Number.MAX_SAFE_INTEGER);
  state.ordersDone = Math.floor(num(d.ordersDone, 0, 0, Number.MAX_SAFE_INTEGER));
  state.cleans     = Math.floor(num(d.cleans, 0, 0, Number.MAX_SAFE_INTEGER));
  state.orderTimer = num(d.orderTimer, ORDERS.firstDelay, 0, Number.MAX_SAFE_INTEGER);
  state.order      = sanitizeOrder(d.order);
  state.cat        = sanitizeCat(d.cat);
  state.achievements = Array.isArray(d.achievements)
    ? d.achievements.filter(a => typeof a === 'string').slice(0, 64) : [];
  state.playTime   = num(d.playTime, 0, 0, Number.MAX_SAFE_INTEGER);
  state.seenIntro  = !!d.seenIntro;
  state.muted      = !!d.muted;
  state.lang       = typeof d.lang === 'string' ? d.lang : null;

  state.cleaning = null;
  state.autoAcc = 0;
  return true;
}

/* Заказ и кот приходят из сейва как есть, поэтому проверяем поля:
   битый объект не должен ломать цикл. */
function sanitizeOrder(o){
  if(!o || typeof o !== 'object') return null;
  const kind = o.kind;
  if(kind !== 'clicks' && kind !== 'heat' && kind !== 'earn') return null;
  const n = (v, def) => (Number.isFinite(Number(v)) ? Number(v) : def);
  const window = n(o.window, ORDERS.clicks.window);
  const left = clamp(n(o.left, window), 0, window);
  if(left <= 0) return null;
  return {
    kind,
    goal: Math.max(1, n(o.goal, 1)),
    progress: Math.max(0, n(o.progress, 0)),
    window, left,
    startEarned: Math.max(0, n(o.startEarned, 0))
  };
}

function sanitizeCat(c){
  if(!c || typeof c !== 'object') return null;
  const n = (v, def, lo, hi) => {
    const x = Number(v);
    return Number.isFinite(x) ? clamp(x, lo, hi) : def;
  };
  const mode = ['walk', 'rest', 'keyboard'].includes(c.mode) ? c.mode : 'walk';
  return {
    x: n(c.x, 0.5, 0, 1),
    dir: c.dir < 0 ? -1 : 1,
    mode,
    timer: n(c.timer, 1, 0, CAT.walkMax),
    blockLeft: n(c.blockLeft, 0, 0, CAT.keyboardBlock),
    petLeft: n(c.petLeft, 0, 0, CAT.petDuration),
    petCd: n(c.petCd, 0, 0, CAT.petCooldown)
  };
}

export function reset(state){
  const fresh = createState();
  fresh.lang = state.lang;          // язык и звук — настройки игрока, не прогресс
  fresh.muted = state.muted;
  Object.assign(state, fresh);
  state.levels = fresh.levels;
  return state;
}

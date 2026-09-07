/* =====================================================================
   Обёртка над платформой.

   Игровая логика знает только этот интерфейс: язык, готовность, хранилище
   и реклама. Какая площадка под ним — Яндекс, Playgama или вообще ничего —
   её не касается. Любая ошибка площадки роняет адаптер в заглушку,
   а не игру: неработающий SDK не должен мешать играть.
===================================================================== */

import { PLATFORM, SAVE } from '../config.js';
import { LOCALES, FALLBACK_LOCALE } from '../i18n.js';

let adapter = null;
let readyCalled = false;
let sessionStart = 0;
let lastInterstitial = 0;

/* ---- утилиты --------------------------------------------------------- */
const now = () => Date.now() / 1000;

function loadScript(src, timeout){
  return new Promise((resolve, reject) => {
    const el = document.createElement('script');
    let done = false;
    const finish = (ok, err) => {
      if(done) return;
      done = true;
      clearTimeout(timer);
      ok ? resolve() : reject(err || new Error('script failed'));
    };
    const timer = setTimeout(() => finish(false, new Error('timeout')), timeout);
    el.src = src;
    el.onload = () => finish(true);
    el.onerror = () => finish(false);
    document.head.appendChild(el);
  });
}

function hostMatches(list){
  const h = (location.hostname || '').toLowerCase();
  /* игра на Яндексе живёт во фрейме, поэтому смотрим и на родителя */
  let ref = '';
  try{ ref = (document.referrer || '').toLowerCase(); }catch(e){}
  return list.some(d => h.endsWith(d) || ref.includes(d));
}

/* Локальное хранилище — всегда доступно и всегда пишется:
   облако может отвалиться, а прогресс терять нельзя. */
const local = {
  load(key){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }catch(e){ return null; }
  },
  save(key, data){
    try{ localStorage.setItem(key, JSON.stringify(data)); return true; }
    catch(e){ return false; }
  },
  clear(key){
    try{ localStorage.removeItem(key); return true; }catch(e){ return false; }
  }
};

/* Из двух сейвов берём тот, что новее. */
function newer(a, b){
  if(!a) return b;
  if(!b) return a;
  return (Number(a.savedAt) || 0) >= (Number(b.savedAt) || 0) ? a : b;
}

/* ---- заглушка: разработка и любая неизвестная площадка --------------- */
const stub = {
  id: 'none',
  async init(){ return true; },
  language(){
    const raw = (typeof navigator !== 'undefined' &&
      (navigator.language || navigator.userLanguage)) || '';
    const code = String(raw).toLowerCase().split('-')[0];
    return LOCALES.includes(code) ? code : FALLBACK_LOCALE;
  },
  ready(){},
  gameplay(){},
  async load(key){ return local.load(key); },
  async save(key, data){ return local.save(key, data); },
  async rewarded(){ return true; },      // вне площадки считаем ролик просмотренным
  async interstitial(){ return false; }
};

/* ---- Яндекс.Игры ------------------------------------------------------ */
const yandex = {
  id: 'yandex',
  ysdk: null,
  player: null,

  async init(){
    await loadScript(PLATFORM.yandex.sdk, PLATFORM.sdkTimeout);
    this.ysdk = await window.YaGames.init();
    try{
      this.player = await this.ysdk.getPlayer({ scopes: false });
    }catch(e){
      this.player = null;                // играет без входа — сохраняемся локально
    }
    return true;
  },

  language(){
    try{
      const code = String(this.ysdk.environment.i18n.lang || '').toLowerCase();
      return LOCALES.includes(code) ? code : FALLBACK_LOCALE;
    }catch(e){ return stub.language(); }
  },

  /* Обязательный вызов: платформа должна узнать, что игра готова,
     до того как она стала интерактивной. */
  ready(){
    try{ this.ysdk.features.LoadingAPI.ready(); }catch(e){}
  },

  gameplay(active){
    try{
      const api = this.ysdk.features.GameplayAPI;
      active ? api.start() : api.stop();
    }catch(e){}
  },

  async load(key){
    const localSave = local.load(key);
    if(!this.player) return localSave;
    try{
      const data = await this.player.getData([PLATFORM.yandex.dataKey]);
      return newer(data && data[PLATFORM.yandex.dataKey], localSave);
    }catch(e){ return localSave; }
  },

  async save(key, data){
    local.save(key, data);               // локально — всегда и сразу
    if(!this.player) return true;
    try{
      await this.player.setData({ [PLATFORM.yandex.dataKey]: data }, false);
      return true;
    }catch(e){ return false; }
  },

  rewarded(){
    return new Promise(resolve => {
      let rewarded = false;
      try{
        this.ysdk.adv.showRewardedVideo({ callbacks: {
          onRewarded: () => { rewarded = true; },
          onClose: () => resolve(rewarded),
          onError: () => resolve(false)
        }});
      }catch(e){ resolve(false); }
    });
  },

  interstitial(){
    return new Promise(resolve => {
      try{
        this.ysdk.adv.showFullscreenAdv({ callbacks: {
          onClose: shown => resolve(!!shown),
          onError: () => resolve(false)
        }});
      }catch(e){ resolve(false); }
    });
  }
};

/* ---- Playgama Bridge --------------------------------------------------
   Форма адаптера та же. Адрес скрипта из этого окружения проверить
   не удалось (см. комментарий в config.js), поэтому при любой заминке
   игра остаётся на заглушке.
--------------------------------------------------------------------- */
const playgama = {
  id: 'playgama',
  bridge: null,

  async init(){
    await loadScript(PLATFORM.playgama.sdk, PLATFORM.sdkTimeout);
    this.bridge = window.bridge;
    if(!this.bridge) throw new Error('bridge missing');
    if(this.bridge.initialize) await this.bridge.initialize();
    return true;
  },

  language(){
    try{
      const code = String(this.bridge.platform.language || '').toLowerCase().split('-')[0];
      return LOCALES.includes(code) ? code : FALLBACK_LOCALE;
    }catch(e){ return stub.language(); }
  },

  ready(){
    try{ this.bridge.platform.sendMessage('game_ready'); }catch(e){}
  },

  gameplay(active){
    try{
      this.bridge.platform.sendMessage(active ? 'gameplay_started' : 'gameplay_stopped');
    }catch(e){}
  },

  async load(key){
    const localSave = local.load(key);
    try{
      const data = await this.bridge.storage.get(PLATFORM.playgama.dataKey);
      return newer(typeof data === 'string' ? JSON.parse(data) : data, localSave);
    }catch(e){ return localSave; }
  },

  async save(key, data){
    local.save(key, data);
    try{ await this.bridge.storage.set(PLATFORM.playgama.dataKey, data); return true; }
    catch(e){ return false; }
  },

  async rewarded(){
    try{ return !!(await this.bridge.advertisement.showRewarded()); }
    catch(e){ return false; }
  },

  async interstitial(){
    try{ return !!(await this.bridge.advertisement.showInterstitial()); }
    catch(e){ return false; }
  }
};

/* ---- выбор площадки --------------------------------------------------- */
function pick(){
  const t = PLATFORM.target;
  if(t === 'yandex') return yandex;
  if(t === 'playgama') return playgama;
  if(t === 'none') return stub;
  if(hostMatches(PLATFORM.yandex.hosts)) return yandex;
  if(hostMatches(PLATFORM.playgama.hosts)) return playgama;
  return stub;
}

/* ---- публичный интерфейс ---------------------------------------------- */
export const sdk = {

  async init(){
    sessionStart = now();
    const candidate = pick();
    if(candidate === stub){ adapter = stub; return this; }
    try{
      await candidate.init();
      adapter = candidate;
    }catch(e){
      /* площадка не отозвалась — играем без неё, но играем */
      adapter = stub;
    }
    return this;
  },

  platform(){ return adapter ? adapter.id : stub.id; },

  ready(){
    if(readyCalled) return;
    readyCalled = true;
    (adapter || stub).ready();
    (adapter || stub).gameplay(true);
  },

  gameplay(active){ (adapter || stub).gameplay(active); },

  language(){ return (adapter || stub).language(); },

  storage: {
    async load(key){ return (adapter || stub).load(key); },
    async save(key, data){ return (adapter || stub).save(key, data); },
    async clear(key){ return local.clear(key); }
  },

  /* Ролик за награду показывается по запросу игрока, без ограничений
     по частоте: он сам его просит. */
  async rewarded(){ return (adapter || stub).rewarded(); },

  /* Межстраничная — наоборот, строго по правилам §2: не в первые
     30 секунд сессии и не чаще раза в минуту. */
  canShowInterstitial(){
    const t = now();
    return t - sessionStart >= PLATFORM.ads.firstDelay &&
           t - lastInterstitial >= PLATFORM.ads.minGap;
  },

  async interstitial(){
    if(!this.canShowInterstitial()) return false;
    lastInterstitial = now();
    return (adapter || stub).interstitial();
  }
};

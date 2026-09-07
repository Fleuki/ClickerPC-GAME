/* Обёртка над платформенным SDK.
   В фазе 1 работает заглушка: язык из navigator, сейв в localStorage.
   В фазе 4 внутренности методов заменятся на Yandex SDK без правок игровой логики. */

import { LOCALES, FALLBACK_LOCALE } from '../i18n.js';

let ready = false;
let native = null;                       // сюда в фазе 4 ляжет YaGames-инстанс

export const sdk = {

  /* Инициализация платформы. Заглушка резолвится сразу. */
  async init(){
    native = null;
    return this;
  },

  /* Вызывается, когда игра стала интерактивной (LoadingAPI.ready в фазе 4). */
  ready(){
    if(ready) return;
    ready = true;
    if(native && native.features && native.features.LoadingAPI) native.features.LoadingAPI.ready();
  },

  /* Язык игрока. Никогда не хардкодим — берём у платформы, иначе у браузера. */
  language(){
    const raw = (typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) || '';
    const code = String(raw).toLowerCase().split('-')[0];
    return LOCALES.includes(code) ? code : FALLBACK_LOCALE;
  },

  /* Реклама. Вне платформы — заглушки: rewarded считается просмотренным,
     межстраничная не показывается. В фазе 4 внутренности заменятся
     на вызовы Yandex SDK, игровая логика не изменится. */
  async rewarded(){
    if(native && native.adv) return new Promise(resolve => {
      let ok = false;
      native.adv.showRewardedVideo({ callbacks: {
        onRewarded: () => { ok = true; },
        onClose: () => resolve(ok),
        onError: () => resolve(false)
      }});
    });
    return true;
  },

  async interstitial(){
    if(native && native.adv) return new Promise(resolve => {
      native.adv.showFullscreenAdv({ callbacks: {
        onClose: was => resolve(!!was),
        onError: () => resolve(false)
      }});
    });
    return false;
  },

  /* Хранилище. Асинхронное намеренно: облачный сейв Яндекса тоже асинхронный. */
  storage:{
    async load(key){
      try{
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      }catch(e){ return null; }
    },
    async save(key, data){
      try{
        localStorage.setItem(key, JSON.stringify(data));
        return true;
      }catch(e){ return false; }
    },
    async clear(key){
      try{ localStorage.removeItem(key); return true; }catch(e){ return false; }
    }
  }
};

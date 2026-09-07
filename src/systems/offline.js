/* Оффлайн-доход (§6).

   passiveRate x процент_накопителя x min(часы отсутствия, лимит накопителя).
   Считается один раз при заходе — по времени, записанному в сейве. */

import { OFFLINE } from '../config.js';
import { passiveIncome, offlineShare, offlineHours } from '../economy.js';

/* Сколько накопилось за отсутствие. Возвращает { seconds, hours, amount }
   или null, если отсутствие слишком короткое и считать нечего. */
export function collect(state, savedAt, now){
  if(!savedAt) return null;
  const seconds = Math.max(0, (now - savedAt) / 1000);
  if(seconds < OFFLINE.minSeconds) return null;

  const cappedHours = Math.min(seconds / 3600, offlineHours(state.levels));
  if(cappedHours <= 0) return null;

  /* берём пассив «как если бы система работала спокойно»: без разгона,
     без комбо и без троттлинга — иначе доход зависел бы от того,
     в каком состоянии игрок закрыл вкладку */
  const calm = {
    levels: state.levels,
    heat: 0,
    throttling: false,
    combo: 0,
    boost: { left: 0, cooldown: 0 },
    reputation: state.reputation,
    location: state.location,
    playTime: state.playTime
  };
  const amount = passiveIncome(calm) * offlineShare(state.levels) * cappedHours * 3600;
  if(!(amount > 0)) return null;

  return { seconds, hours: cappedHours, amount };
}

export function grant(state, amount){
  state.money += amount;
  state.earned += amount;
  state.totalEarned += amount;
}

export const adMultiplier = () => OFFLINE.adMultiplier;

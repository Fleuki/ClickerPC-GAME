/* Заказы клиентов (§6).

   Раз в 40–70 секунд приходит клиент с одной из трёх задач. Награда —
   20 секунд текущего дохода, умноженные на 1.5. Смысл в том, чтобы дать
   цель между покупками и превратить фоновое кликание в короткие спринты. */

import { ORDERS, HEAT } from '../config.js';
import { incomePerSecond } from '../economy.js';

export const KINDS = ['clicks', 'heat', 'earn'];

const rand = (a, b) => a + Math.random() * (b - a);

export function createOrder(state){
  const kind = KINDS[Math.floor(Math.random() * KINDS.length)];
  const order = { kind, progress: 0, goal: 0, window: 0, left: 0, startEarned: state.earned };

  if(kind === 'clicks'){
    order.window = ORDERS.clicks.window;
    order.goal = ORDERS.clicks.goal;
  }else if(kind === 'heat'){
    order.window = ORDERS.heat.window;
    order.goal = ORDERS.heat.goal;
  }else{
    order.window = ORDERS.earn.window;
    /* цель считается от текущего дохода: заказ должен быть по силам
       и новичку, и тому, кто уже собрал половину сетапа */
    order.goal = Math.max(1, incomePerSecond(state) * order.window * ORDERS.earn.factor);
  }
  order.left = order.window;
  return order;
}

export function reward(state){
  return incomePerSecond(state) * ORDERS.rewardSeconds * ORDERS.rewardMult;
}

/* Ручной клик засчитывается в заказ «сделай N кликов». */
export function registerClick(state){
  if(state.order && state.order.kind === 'clicks') state.order.progress += 1;
}

/* Возвращает 'done' | 'failed' | null — вызывающий решает, что показать. */
export function update(state, dt){
  if(!state.order){
    state.orderTimer -= dt;
    if(state.orderTimer <= 0) state.order = createOrder(state);
    return null;
  }

  const o = state.order;
  o.left -= dt;

  if(o.kind === 'heat'){
    const zone = HEAT.zones[1].from, top = HEAT.zones[2].from;
    if(!state.throttling && state.heat >= zone && state.heat < top) o.progress += dt;
  }else if(o.kind === 'earn'){
    o.progress = state.earned - o.startEarned;
  }

  if(o.progress >= o.goal){
    const pay = reward(state);
    state.money += pay;
    state.earned += pay;
    state.totalEarned += pay;
    state.ordersDone += 1;
    state.order = null;
    state.orderTimer = rand(ORDERS.gapMin, ORDERS.gapMax);
    state.lastReward = pay;
    return 'done';
  }
  if(o.left <= 0){
    state.order = null;
    state.orderTimer = ORDERS.retryGap;
    return 'failed';
  }
  return null;
}

/* Доля выполнения 0..1 — для полосы в интерфейсе. */
export function share(order){
  if(!order || order.goal <= 0) return 0;
  return Math.max(0, Math.min(1, order.progress / order.goal));
}

/* HUD: баланс, доход, температура, ватты, пыль, «Разгон», чистка.
   Весь текст — через текстовые узлы, innerHTML не используется. */

import { HEAT, DUST, UI, MAX_LEVEL } from '../config.js';
import { t, fmt, fmtMult, pct } from '../i18n.js';
import * as Economy from '../economy.js';
import * as HeatSys from '../systems/heat.js';
import * as DustSys from '../systems/dust.js';

const el = {};
let handlers = {};

function make(tag, cls, parent){
  const n = document.createElement(tag);
  if(cls) n.className = cls;
  if(parent) parent.appendChild(n);
  return n;
}

/* доля 0..1 -> ширина в процентах для CSS */
const share = v => (Economy.clamp(v, 0, 1) * 100) + '%';

function gauge(parent, icon, zone){
  const row = make('div', 'gauge', parent);
  make('label', null, row).textContent = icon;
  const track = make('div', 'track', row);
  const z = zone ? make('div', 'zone', track) : null;
  const fill = make('div', 'fill', track);
  const val = make('b', null, row);
  return { row, track, zone: z, fill, val };
}

export function init(root, h){
  handlers = h;
  root.textContent = '';

  const top = make('div', 'hud-top', root);
  const money = make('div', 'money', top);
  el.money = make('b', null, money);
  el.currency = make('span', null, money);
  el.currency.textContent = '₽';

  const rates = make('div', 'rates', top);
  const r1 = make('span', null, rates);
  el.perClickLabel = document.createTextNode('');
  r1.appendChild(el.perClickLabel);
  el.perClick = make('i', null, r1);
  const r2 = make('span', null, rates);
  el.perSecLabel = document.createTextNode('');
  r2.appendChild(el.perSecLabel);
  el.perSec = make('i', null, r2);

  const gauges = make('div', 'gauges', root);
  el.heat = gauge(gauges, '🌡', true);
  el.watt = gauge(gauges, '⚡', false);
  el.watt.fill.classList.add('watt');
  el.dust = gauge(gauges, '🌫', false);
  el.dust.fill.classList.add('dust');

  /* рабочая зона на шкале температуры размечается по конфигу */
  const zoneFrom = HEAT.zones[1].from, zoneTo = HEAT.zones[2].from;
  el.heat.zone.style.left  = share(zoneFrom / HEAT.throttleIn);
  el.heat.zone.style.width = share((zoneTo - zoneFrom) / HEAT.throttleIn);

  const acts = make('div', 'acts', root);
  el.boost = make('button', null, acts);
  el.boost.addEventListener('click', () => handlers.onBoost && handlers.onBoost());
  el.clean = make('button', null, acts);
  el.clean.addEventListener('click', () => handlers.onClean && handlers.onClean());

  el.note = make('div', 'note', root);
  applyLabels();
}

/* Перерисовка подписей при смене языка. */
export function applyLabels(){
  el.perClickLabel.nodeValue = t('hud.perClick') + ' ';
  el.perSecLabel.nodeValue = t('hud.perSec') + ' ';
}

export function update(state){
  el.money.textContent = fmt(state.money);
  el.perClick.textContent = fmt(Economy.clickValue(state));
  el.perSec.textContent = fmt(Economy.incomePerSecond(state));

  /* температура */
  const heatShare = Economy.clamp(state.heat / HEAT.throttleIn, 0, 1);
  el.heat.fill.style.width = share(heatShare);
  el.heat.fill.style.background = state.throttling ? 'var(--burn)'
    : state.heat < HEAT.zones[1].from ? 'var(--cold)'
    : state.heat < HEAT.zones[2].from ? 'var(--warm)' : 'var(--hot)';
  el.heat.val.textContent = t('hud.heatValue', { v: Math.round(state.heat) });
  el.heat.val.classList.toggle('warn', state.throttling);

  /* ватты */
  const used = Economy.totalWatts(state.levels), limit = Economy.wattLimit(state.levels);
  el.watt.fill.style.width = share(used / limit);
  el.watt.val.textContent = t('hud.wattValue', { used: Math.round(used), limit: Math.round(limit) });
  el.watt.val.classList.toggle('warn', used / limit > UI.wattWarn);

  /* пыль */
  el.dust.fill.style.width = share(state.dust / DUST.max);
  el.dust.val.textContent = t('hud.dustValue', { v: pct(state.dust / DUST.max) });

  /* разгон */
  const onBoost = state.boost.left > 0;
  el.boost.classList.toggle('on', onBoost);
  el.boost.disabled = !HeatSys.boostReady(state);
  el.boost.textContent = onBoost ? t('hud.boostOn', { v: state.boost.left.toFixed(1) })
    : state.boost.cooldown > 0 ? t('hud.boostWait', { v: Math.ceil(state.boost.cooldown) })
    : t('hud.boost', { v: fmtMult(HEAT.boost.income) });

  /* чистка */
  if(state.cleaning){
    el.clean.textContent = t('hud.cleaning', { v: state.cleaning.left });
    el.clean.disabled = true;
    el.clean.classList.add('alert');
  }else{
    const can = DustSys.canClean(state);
    el.clean.textContent = can ? t('hud.clean') : t('hud.cleanNone');
    el.clean.disabled = !can;
    el.clean.classList.toggle('alert', state.dust > UI.dustWarn);
  }

  updateNote(state, used, limit);
}

function updateNote(state, used, limit){
  let msg = '', bad = false;
  if(state.throttling){
    msg = t('note.throttle', { v: fmtMult(HEAT.throttleIncome), out: HEAT.throttleOut });
    bad = true;
  }else if(state.dust > UI.dustWarn){
    msg = t('note.dust');
  }else if(state.heat >= HEAT.zones[2].from){
    msg = t('note.red', { v: fmtMult(HEAT.zones[2].mult) });
  }else if(state.heat >= HEAT.zones[1].from){
    msg = t('note.warm', { v: fmtMult(HEAT.zones[1].mult) });
  }else if(used / limit > UI.wattWarn){
    msg = t('note.watts');
  }
  el.note.textContent = msg;
  el.note.classList.toggle('show', !!msg);
  el.note.classList.toggle('bad', bad);
}

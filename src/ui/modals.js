/* Модальные окна: статистика, подтверждение сброса, выбор языка. */

import { t, fmt, fmtMult, pct, LOCALES, locale } from '../i18n.js';
import { PRESTIGE, ECONOMY, OFFLINE } from '../config.js';
import * as Economy from '../economy.js';
import * as PrestigeSys from '../systems/prestige.js';
import * as Achievements from '../systems/achievements.js';

let scrim = null;

function make(tag, cls, parent){
  const n = document.createElement(tag);
  if(cls) n.className = cls;
  if(parent) parent.appendChild(n);
  return n;
}

export function close(){
  if(scrim && scrim.parentNode) scrim.parentNode.removeChild(scrim);
  scrim = null;
}

export const isOpen = () => !!scrim;

function open(){
  close();
  scrim = make('div', 'scrim');
  scrim.addEventListener('pointerdown', e => { if(e.target === scrim) close(); });
  document.body.appendChild(scrim);
  return make('div', 'modal', scrim);
}

function row(list, label, value){
  const r = make('div', null, list);
  make('span', null, r).textContent = label;
  make('b', null, r).textContent = value;
}

/* ---- всплывающие сообщения ------------------------------------------
   Заказы, достижения и переезд сообщают о себе здесь: модалку ради этого
   открывать незачем, а в строке подсказок они бы затирали друг друга.
--------------------------------------------------------------------- */
let toastBox = null;

export function toast(text, kind){
  if(!toastBox){
    toastBox = make('div', 'toasts');
    document.body.appendChild(toastBox);
  }
  const el = make('div', 'toast' + (kind ? ' ' + kind : ''), toastBox);
  el.textContent = text;
  setTimeout(() => { if(el.parentNode) el.parentNode.removeChild(el); }, 3200);
  while(toastBox.childElementCount > 3) toastBox.removeChild(toastBox.firstChild);
}

/* ---- переезд (§6) ---------------------------------------------------- */
export function prestige(state, onConfirm){
  const m = open();
  make('h2', null, m).textContent = t('move.title');
  const gain = PrestigeSys.reputationGain(state);
  const next = Math.min(PRESTIGE.locations - 1, (state.location || 0) + 1);
  const last = (state.location || 0) >= PRESTIGE.locations - 1;

  make('p', null, m).textContent = t('move.text', {
    next: t('loc.' + next),
    r: gain,
    p: Math.round(gain * ECONOMY.repBonus * 100)
  });

  const list = make('div', 'rowlist', m);
  row(list, t('stats.earned'), fmt(state.earned) + ' ₽');
  row(list, t('stats.rep'), String(state.reputation) + ' → ' + String(state.reputation + gain));
  row(list, t('stats.loc'), t('loc.' + (state.location || 0)) + (last ? '' : ' → ' + t('loc.' + next)));
  if(last) make('p', null, m).textContent = t('move.last');

  const btns = make('div', 'btns', m);
  const cancel = make('button', null, btns);
  cancel.textContent = t('menu.cancel');
  cancel.addEventListener('click', close);
  const yes = make('button', 'danger', btns);
  yes.textContent = t('move.confirm');
  yes.addEventListener('click', () => { close(); onConfirm(); });
}

/* ---- «пока тебя не было» (§6) ---------------------------------------- */
export function offline(state, info, onTake, onDouble){
  const m = open();
  make('h2', null, m).textContent = t('offline.title');
  const h = Math.floor(info.hours);
  const min = Math.round((info.hours - h) * 60);
  make('p', null, m).textContent = t('offline.text', {
    h: t('offline.span', { h, m: min }),
    p: pct(Economy.offlineShare(state.levels))
  });

  const btns = make('div', 'btns', m);
  const dbl = make('button', null, btns);
  dbl.textContent = t('offline.double');
  dbl.addEventListener('click', () => { close(); onDouble(info.amount * OFFLINE.adMultiplier); });
  const take = make('button', null, btns);
  take.textContent = t('offline.take', { v: fmt(info.amount) });
  take.addEventListener('click', () => { close(); onTake(info.amount); });
}

/* ---- достижения ------------------------------------------------------ */
export function achievements(state){
  const m = open();
  make('h2', null, m).textContent = t('ach.title');
  make('p', null, m).textContent = t('ach.count', {
    n: Achievements.unlockedCount(state), total: Achievements.total()
  });
  const list = make('div', 'rowlist', m);
  for(const a of Achievements.LIST){
    const got = state.achievements.includes(a.id);
    const r = make('div', null, list);
    const label = make('span', null, r);
    label.textContent = t('ach.' + a.id);
    if(got) label.style.color = 'var(--ink)';
    make('b', null, r).textContent = got ? '✓' : '—';
  }
  const btns = make('div', 'btns', m);
  const ok = make('button', null, btns);
  ok.textContent = t('menu.close');
  ok.addEventListener('click', close);
}

export function stats(state){
  const m = open();
  make('h2', null, m).textContent = t('stats.title');
  const list = make('div', 'rowlist', m);

  const hours = Math.floor(state.playTime / 3600);
  const mins = Math.floor((state.playTime % 3600) / 60);

  row(list, t('stats.clicks'),  fmt(state.clicks));
  row(list, t('stats.earned'),  fmt(state.earned) + ' ₽');
  row(list, t('stats.total'),   fmt(state.totalEarned) + ' ₽');
  row(list, t('stats.loc'),     t('loc.' + (state.location || 0)));
  row(list, t('stats.rep'),     String(state.reputation));
  row(list, t('stats.orders'),  String(state.ordersDone));
  row(list, t('stats.time'),    t('stats.timeVal', { h: hours, m: mins }));
  row(list, t('stats.click'),   fmt(Economy.clickValue(state)));
  row(list, t('stats.sec'),     fmt(Economy.incomePerSecond(state)));
  row(list, t('stats.global'),  '×' + fmtMult(Economy.globalMult(state.levels, state.reputation, state.location)));
  row(list, t('stats.crit'),    pct(Economy.critChance(state.levels)) + '%');
  row(list, t('stats.auto'),    fmtMult(Economy.autoCps(state)));
  row(list, t('stats.cooling'), fmtMult(Economy.coolRate(state.levels, state.dust, state)) + '°');
  row(list, t('stats.offline'), t('stats.offlineVal', {
    p: pct(Economy.offlineShare(state.levels)),
    h: Economy.offlineHours(state.levels)
  }));

  const btns = make('div', 'btns', m);
  const sound = make('button', null, btns);
  const soundLabel = () => t(onMuteQuery && onMuteQuery() ? 'menu.soundOff' : 'menu.soundOn');
  sound.textContent = soundLabel();
  sound.addEventListener('click', () => {
    if(onMute) onMute();
    sound.textContent = soundLabel();
  });
  const lang = make('button', null, btns);
  lang.textContent = t('menu.lang') + ': ' + locale().toUpperCase();
  lang.addEventListener('click', () => {
    const next = LOCALES[(LOCALES.indexOf(locale()) + 1) % LOCALES.length];
    close();
    if(onLanguage) onLanguage(next);
  });
  const ok = make('button', null, btns);
  ok.textContent = t('menu.close');
  ok.addEventListener('click', close);
}

export function confirmReset(onConfirm){
  const m = open();
  make('h2', null, m).textContent = t('menu.resetTitle');
  make('p', null, m).textContent = t('menu.resetText');
  const btns = make('div', 'btns', m);
  const cancel = make('button', null, btns);
  cancel.textContent = t('menu.cancel');
  cancel.addEventListener('click', close);
  const yes = make('button', 'danger', btns);
  yes.textContent = t('menu.confirm');
  yes.addEventListener('click', () => { close(); onConfirm(); });
}

let onLanguage = null;
export function setLanguageHandler(fn){ onLanguage = fn; }

let onMute = null, onMuteQuery = null;
export function setMuteHandler(fn, query){ onMute = fn; onMuteQuery = query; }

/* Модальные окна: статистика, подтверждение сброса, выбор языка. */

import { t, fmt, fmtMult, pct, LOCALES, locale } from '../i18n.js';
import * as Economy from '../economy.js';

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

export function stats(state){
  const m = open();
  make('h2', null, m).textContent = t('stats.title');
  const list = make('div', 'rowlist', m);

  const hours = Math.floor(state.playTime / 3600);
  const mins = Math.floor((state.playTime % 3600) / 60);

  row(list, t('stats.clicks'),  fmt(state.clicks));
  row(list, t('stats.earned'),  fmt(state.earned) + ' ₽');
  row(list, t('stats.time'),    t('stats.timeVal', { h: hours, m: mins }));
  row(list, t('stats.click'),   fmt(Economy.clickValue(state)));
  row(list, t('stats.sec'),     fmt(Economy.incomePerSecond(state)));
  row(list, t('stats.global'),  '×' + fmtMult(Economy.globalMult(state.levels, state.reputation)));
  row(list, t('stats.crit'),    pct(Economy.critChance(state.levels)) + '%');
  row(list, t('stats.auto'),    fmtMult(Economy.autoCps(state)));
  row(list, t('stats.cooling'), fmtMult(Economy.coolRate(state.levels, state.dust)) + '°');
  row(list, t('stats.offline'), t('stats.offlineVal', {
    p: pct(Economy.offlineShare(state.levels)),
    h: Economy.offlineHours(state.levels)
  }));

  const btns = make('div', 'btns', m);
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

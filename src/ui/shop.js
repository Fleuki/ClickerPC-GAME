/* Магазин: три вкладки, карточка на категорию, блокировка по ваттам. */

import { CATEGORIES, TABS, MAX_LEVEL } from '../config.js';
import { t, tier, fmt, fmtMult, pct } from '../i18n.js';
import * as Economy from '../economy.js';

const cards = new Map();
const tabButtons = new Map();
let activeTab = TABS[0];
let handlers = {};
let footEls = null;

function make(tag, cls, parent){
  const n = document.createElement(tag);
  if(cls) n.className = cls;
  if(parent) parent.appendChild(n);
  return n;
}

/* ---- описание эффекта категории на конкретном уровне ------------------ */
export function effectText(id, level){
  const v = (effect) => Economy.valueAt(id, effect, level);
  switch(id){
    case 'cpu':        return t('eff.cpu',        { v: fmt(v('clickBase')) });
    case 'gpu':        return t('eff.gpu',        { v: fmt(v('income')) });
    case 'ram':        return t('eff.ram',        { v: fmtMult(v('autoMult')) });
    case 'ssd':        return t('eff.ssd',        { p: pct(v('offlineShare')), h: v('offlineHours') });
    case 'psu':        return t('eff.psu',        { v: Math.round(v('wattLimit')) });
    case 'cooler':     return t('eff.cooler',     { v: fmtMult(v('cooling')) });
    case 'mouse':      return t('eff.mouse',      { v: fmtMult(v('clickMult')), p: pct(v('critChance')) });
    case 'keyboard':   return level === 0 ? t('eff.keyboardNone')
                                          : t('eff.keyboard', { v: fmtMult(v('autoCps')) });
    case 'monitor':    return t('eff.monitor',    { v: fmtMult(v('globalMult')) });
    case 'headphones': return t('eff.headphones', { v: fmtMult(v('comboWindow')) });
    case 'furniture':  return t('eff.furniture',  { v: fmtMult(v('globalMult')) });
    case 'rgb':        return t('eff.rgb',        { v: fmtMult(v('globalMult')) });
    case 'ac':         return t('eff.ac',         { v: fmtMult(v('cooling')), d: fmtMult(v('dustFactor')) });
    case 'decor':      return t('eff.decor',      { v: fmtMult(v('globalMult')) });
    default:           return '';
  }
}

/* ---- построение ------------------------------------------------------- */
export function init(tabsRoot, shopRoot, h){
  handlers = h;
  tabsRoot.textContent = '';
  shopRoot.textContent = '';
  cards.clear();
  tabButtons.clear();

  for(const tab of TABS){
    const b = make('button', null, tabsRoot);
    b.addEventListener('click', () => selectTab(tab));
    tabButtons.set(tab, b);
  }

  for(const c of CATEGORIES){
    const card = make('button', 'card', shopRoot);
    card.addEventListener('click', () => handlers.onBuy && handlers.onBuy(c.id));

    make('span', 'ic', card).textContent = c.icon;
    const txt = make('span', 'txt', card);
    const nm = make('span', 'nm', txt);
    const name = make('b', null, nm);
    const sub = make('u', null, nm);
    const eff = make('i', 'ef', txt);
    const pipsWrap = make('span', 'pips', txt);
    const pips = [];
    for(let i = 0; i < MAX_LEVEL; i++) pips.push(make('s', null, pipsWrap));

    const side = make('span', 'side', card);
    const cost = make('span', 'cost', side);
    const wt = make('span', 'wt', side);

    cards.set(c.id, { card, name, sub, eff, pips, cost, wt, cat: c });
  }

  /* подвал: статистика и сброс */
  const foot = make('div', 'foot', shopRoot);
  const stats = make('button', null, foot);
  stats.addEventListener('click', () => handlers.onStats && handlers.onStats());
  const reset = make('button', null, foot);
  reset.addEventListener('click', () => handlers.onReset && handlers.onReset());
  footEls = { stats, reset };

  applyLabels();
  selectTab(activeTab);
}

/* Подписи, зависящие от языка. */
export function applyLabels(){
  for(const tab of TABS) tabButtons.get(tab).textContent = t('tab.' + tab);
  if(footEls){
    footEls.stats.textContent = t('menu.stats');
    footEls.reset.textContent = t('menu.reset');
  }
}

export function selectTab(tab){
  activeTab = TABS.includes(tab) ? tab : TABS[0];
  for(const [id, b] of tabButtons) b.classList.toggle('on', id === activeTab);
  for(const [id, c] of cards) c.card.hidden = c.cat.tab !== activeTab;
}

export function currentTab(){ return activeTab; }

/* ---- обновление ------------------------------------------------------- */
export function update(state){
  for(const [id, c] of cards){
    if(c.card.hidden) continue;
    const level = Economy.levelOf(state.levels, id);
    const max = level >= MAX_LEVEL;
    const check = Economy.purchaseCheck(state, id);

    c.name.textContent = t('cat.' + id);
    c.sub.textContent = tier(id, level) + ' · ' + t('shop.level', { v: level });

    if(check.reason === 'watts'){
      c.eff.textContent = t('shop.needWatts', { v: check.deficit });
      c.eff.classList.add('why');
    }else{
      c.eff.textContent = effectText(id, max ? level : level + 1);
      c.eff.classList.remove('why');
    }

    c.cost.textContent = max ? t('shop.max') : t('shop.price', { v: fmt(check.price) });
    c.cost.classList.toggle('max', max);

    if(max){
      c.wt.textContent = '';
    }else{
      const delta = Economy.watts(id, level + 1) - Economy.watts(id, level);
      c.wt.textContent = delta > 0 ? t('shop.watts', { v: delta }) : t('shop.wattsNone');
      c.wt.classList.toggle('bad', check.reason === 'watts');
    }

    c.card.disabled = !check.ok;
    c.card.classList.toggle('can', check.ok);
    c.card.classList.toggle('locked', check.reason === 'watts');
    for(let i = 0; i < c.pips.length; i++) c.pips[i].classList.toggle('on', i < level);
  }
}

/* =====================================================================
   Локализация. Ни одной строки интерфейса за пределами этого файла.
   Язык приходит из platform/sdk.js — здесь он не выбирается и не угадывается.
===================================================================== */

const STRINGS = {

  ru: {
    'hud.perClick':      'за клик',
    'hud.perSec':        'в секунду',
    'hud.heat':          'температура',
    'hud.watts':         'мощность',
    'hud.dust':          'запылённость',
    'hud.heatValue':     '{v}°',
    'hud.wattValue':     '{used} / {limit} Вт',
    'hud.dustValue':     '{v}%',
    'hud.boost':         'Разгон ×{v}',
    'hud.boostOn':       'Разгон {v} с',
    'hud.boostWait':     'Остывает {v} с',
    'hud.clean':         'Почистить',
    'hud.move':          'Переехать',

    'order.clicks':      'Заказ: {n} {n|клик,клика,кликов}',
    'order.heat':        'Заказ: {n} с в рабочей зоне',
    'order.earn':        'Заказ: заработать {n} ₽',
    'order.left':        '{v} с',
    'order.done':        'Заказ сдан: +{v} ₽',
    'order.failed':      'Заказ сорван. Следующий скоро придёт',

    'move.title':        'Переезд',
    'move.text':         'Железо придётся собирать заново. Взамен — {next} и {r} {r|единица,единицы,единиц} репутации навсегда, это +{p}% ко всему доходу.',
    'move.confirm':      'Переехать',
    'move.progress':     'До переезда {v}',
    'move.last':         'Дальше переезжать некуда — это уже серверная',
    'move.done':         'Переезд: {loc}, +{r} репутации',
    'loc.0':             'Комната у родителей',
    'loc.1':             'Съёмная квартира',
    'loc.2':             'Студия',
    'loc.3':             'Офис',
    'loc.4':             'Серверная',

    'offline.title':     'Пока тебя не было',
    'offline.text':      'Сетап работал сам {h}. Накопитель сохранил {p}% дохода.',
    'offline.take':      'Забрать {v} ₽',
    'offline.double':    'Удвоить за ролик',
    'offline.span':      '{h} ч {m} мин',

    'ach.title':         'Достижения',
    'ach.count':         '{n} из {total}',
    'ach.new':           'Достижение: {v}',
    'ach.firstBuy':      'Первая покупка',
    'ach.allOnce':       'Собрано всё по разу',
    'ach.maxOne':        'Что-то доведено до максимума',
    'ach.maxAll':        'Всё на максимуме',
    'ach.clicks1k':      'Тысяча кликов',
    'ach.clicks10k':     'Десять тысяч кликов',
    'ach.combo':         'Полная серия',
    'ach.throttle':      'Довёл до перегрева',
    'ach.spotless':      'Десять чисток корпуса',
    'ach.orders10':      'Десять сданных заказов',
    'ach.move':          'Первый переезд',
    'ach.moveAll':       'Дошёл до серверной',

    'cat.pet':           'Кот доволен: +{p}% к клику',
    'cat.shoo':          'Кот согнан с клавиатуры',
    'cat.keys':          'Кот спит на клавиатуре — автоклики стоят',
    'hud.cleanNone':     'Чисто',
    'hud.cleaning':      'Протри пыль: {v}',
    'hud.cleanAd':       'Сразу за ролик',
    'hud.adFailed':      'Ролик не показался. Попробуй ещё раз',

    'note.throttle':     'Перегрев: доход ×{v}, автоклики стоят. Дай остыть ниже {out}°.',
    'note.warm':         'Рабочая зона: доход ×{v}. Держи темп.',
    'note.red':          'Красная зона: доход ×{v}, до перегрева совсем немного.',
    'note.dust':         'Пыль душит охлаждение. Пора чистить корпус.',
    'note.watts':        'Мощности впритык. Следующая покупка потребует блока питания.',

    'tab.hardware':      'Железо',
    'tab.peripherals':   'Периферия',
    'tab.room':          'Комната',

    'shop.level':        'ур. {v}',
    'shop.max':          'макс',
    'shop.price':        '{v} ₽',
    'shop.watts':        '+{v} Вт',
    'shop.wattsNone':    '0 Вт',
    'shop.needWatts':    'Не хватает {v} Вт. Нужен блок питания помощнее',
    'shop.arrow':        '{now}  →  {next}',

    'scene.tapHint':     'Нажимай куда угодно',
    'scene.combo':       '×{v}',
    'scene.throttle':    'Перегрев',
    'scene.boost':       'Разгон ×{v}',
    'scene.screenTitle': 'Фоновый рендер',
    'scene.screenMoney': '{v} ₽',

    'menu.stats':        'Статистика',
    'menu.ach':          'Достижения',
    'menu.reset':        'Начать заново',
    'menu.resetTitle':   'Начать заново?',
    'menu.resetText':    'Всё железо и деньги пропадут. Отменить это будет нельзя.',
    'menu.cancel':       'Отмена',
    'menu.confirm':      'Начать заново',
    'menu.close':        'Закрыть',
    'menu.lang':         'Язык',
    'menu.soundOn':      'Звук: вкл',
    'menu.soundOff':     'Звук: выкл',

    'stats.title':       'Статистика',
    'stats.clicks':      'Кликов',
    'stats.earned':      'Заработано',
    'stats.time':        'В игре',
    'stats.click':       'За клик',
    'stats.sec':         'В секунду',
    'stats.global':      'Общий множитель',
    'stats.crit':        'Шанс крита',
    'stats.auto':        'Автокликов/сек',
    'stats.cooling':     'Охлаждение',
    'stats.offline':     'Оффлайн',
    'stats.rep':         'Репутация',
    'stats.loc':         'Локация',
    'stats.orders':      'Заказов сдано',
    'stats.total':       'Всего заработано',
    'stats.offlineVal':  '{p}% · до {h} ч',
    'stats.timeVal':     '{h} ч {m} мин',

    'cat.cpu':           'Процессор',
    'cat.gpu':           'Видеокарта',
    'cat.ram':           'Оперативка',
    'cat.ssd':           'Накопитель',
    'cat.psu':           'Блок питания',
    'cat.cooler':        'Охлаждение',
    'cat.mouse':         'Мышь',
    'cat.keyboard':      'Клавиатура',
    'cat.monitor':       'Монитор',
    'cat.headphones':    'Наушники',
    'cat.furniture':     'Мебель',
    'cat.rgb':           'Подсветка',
    'cat.ac':            'Кондиционер',
    'cat.decor':         'Декор',

    'eff.cpu':           '{v} ₽ за клик',
    'eff.gpu':           '{v} ₽/сек фоном',
    'eff.ram':           'автоклики ×{v}',
    'eff.ssd':           'оффлайн {p}% · {h} ч',
    'eff.psu':           'лимит {v} Вт',
    'eff.cooler':        '−{v}°/сек',
    'eff.mouse':         'клик ×{v} · крит {p}%',
    'eff.keyboard':      '{v} автокликов/сек',
    'eff.keyboardNone':  'без макросов',
    'eff.monitor':       'весь доход ×{v}',
    'eff.headphones':    'окно комбо {v} с',
    'eff.furniture':     'весь доход ×{v}',
    'eff.rgb':           'весь доход ×{v}',
    'eff.ac':            '−{v}°/сек · пыль ×{d}',
    'eff.decor':         'весь доход ×{v}',

    'tier.cpu':        ['Хлам 1.6 ГГц','Двухъядерный','Четырёхъядерный','Шесть ядер','Восемь ядер','Разогнанный','Серверный','32 потока'],
    'tier.gpu':        ['Встроенная графика','Затычка 2 ГБ','Бюджетная','Средний сегмент','Игровая','Топовая','Профессиональная','Две карты'],
    'tier.ram':        ['2 ГБ','4 ГБ','8 ГБ','16 ГБ','32 ГБ','64 ГБ','128 ГБ','256 ГБ ECC'],
    'tier.ssd':        ['HDD 160 ГБ','HDD 1 ТБ','SATA SSD','NVMe 512 ГБ','NVMe 1 ТБ','NVMe 2 ТБ','Массив NVMe','Хранилище 8 ТБ'],
    'tier.psu':        ['Ноунейм 250 Вт','Офисный 400 Вт','Бронза 550 Вт','Золото 650 Вт','Золото 850 Вт','Платина 1000 Вт','Титан 1200 Вт','Титан 1600 Вт'],
    'tier.cooler':     ['Стоковый кулер','Алюминиевый','Башня','Две башни','Водянка 240','Водянка 360','Кастом-контур','Криоконтур'],
    'tier.mouse':      ['Офисная','Игровая','Беспроводная','Облегчённая','Киберспортивная','8000 Гц','Сенсор на заказ','Титановая'],
    'tier.keyboard':   ['Мембранная','Механика','С макросами','Хот-свап','Кастом','Смазанная','Оптическая','Аналоговая'],
    'tier.monitor':    ['ЭЛТ 1024×768','TN 60 Гц','IPS 75 Гц','IPS 144 Гц','QHD 165 Гц','Ультраширокий','OLED 240 Гц','Три экрана'],
    'tier.headphones': ['Затычки из метро','Проводные','Накладные','Полноразмерные','Игровые','Студийные','Открытые','Ламповый усилитель'],
    'tier.furniture':  ['Кухонный стол','Стол из ДСП','Компьютерный стол','Кресло из офиса','Игровое кресло','Стол с подъёмом','Эргономичное кресло','Дизайнерский сетап'],
    'tier.rgb':        ['Нет подсветки','Лампа с абажуром','Светодиодная лента','RGB-лента','Панели на стене','Синхронизация','Заливка комнаты','Световое шоу'],
    'tier.ac':         ['Открытая форточка','Настольный вентилятор','Напольный вентилятор','Мобильный кондиционер','Сплит-система','Инвертор','Промышленный','Серверный холод'],
    'tier.decor':      ['Голые стены','Постер','Полка с фигурками','Кот','Растения','Неоновая вывеска','Аквариум','Стена коллекционера']
  },

  en: {
    'hud.perClick':      'per click',
    'hud.perSec':        'per second',
    'hud.heat':          'temperature',
    'hud.watts':         'power',
    'hud.dust':          'dust',
    'hud.heatValue':     '{v}°',
    'hud.wattValue':     '{used} / {limit} W',
    'hud.dustValue':     '{v}%',
    'hud.boost':         'Boost ×{v}',
    'hud.boostOn':       'Boost {v}s',
    'hud.boostWait':     'Cooling {v}s',
    'hud.clean':         'Clean',
    'hud.move':          'Move out',

    'order.clicks':      'Order: {n} {n|click,clicks}',
    'order.heat':        'Order: {n}s in the working zone',
    'order.earn':        'Order: earn {n} ₽',
    'order.left':        '{v}s',
    'order.done':        'Order delivered: +{v} ₽',
    'order.failed':      'Order lost. The next one is coming',

    'move.title':        'Moving out',
    'move.text':         'The hardware goes back to zero. In exchange: {next} and {r} {r|point,points} of reputation forever, which is +{p}% to all income.',
    'move.confirm':      'Move out',
    'move.progress':     '{v} to move out',
    'move.last':         'Nowhere left to move — this is already the server room',
    'move.done':         'Moved in: {loc}, +{r} reputation',
    'loc.0':             'Room at your parents',
    'loc.1':             'Rented flat',
    'loc.2':             'Studio',
    'loc.3':             'Office',
    'loc.4':             'Server room',

    'offline.title':     'While you were away',
    'offline.text':      'The setup ran on its own for {h}. Storage kept {p}% of the income.',
    'offline.take':      'Collect {v} ₽',
    'offline.double':    'Double for an ad',
    'offline.span':      '{h}h {m}m',

    'ach.title':         'Achievements',
    'ach.count':         '{n} of {total}',
    'ach.new':           'Achievement: {v}',
    'ach.firstBuy':      'First purchase',
    'ach.allOnce':       'One of everything',
    'ach.maxOne':        'Something maxed out',
    'ach.maxAll':        'Everything maxed out',
    'ach.clicks1k':      'A thousand clicks',
    'ach.clicks10k':     'Ten thousand clicks',
    'ach.combo':         'Full combo',
    'ach.throttle':      'Pushed it to overheating',
    'ach.spotless':      'Ten case cleanings',
    'ach.orders10':      'Ten orders delivered',
    'ach.move':          'First move',
    'ach.moveAll':       'Reached the server room',

    'cat.pet':           'The cat is pleased: +{p}% per click',
    'cat.shoo':          'Cat shooed off the keyboard',
    'cat.keys':          'Cat asleep on the keyboard — macros are paused',
    'hud.cleanNone':     'Clean',
    'hud.cleaning':      'Wipe the dust: {v}',
    'hud.cleanAd':       'Skip with an ad',
    'hud.adFailed':      'The ad did not play. Try again',

    'note.throttle':     'Overheated: income ×{v}, macros paused. Cool below {out}°.',
    'note.warm':         'Working zone: income ×{v}. Keep the pace.',
    'note.red':          'Red zone: income ×{v}, overheating is close.',
    'note.dust':         'Dust is choking the cooling. Time to clean the case.',
    'note.watts':        'Power is tight. The next upgrade will need a bigger PSU.',

    'tab.hardware':      'Hardware',
    'tab.peripherals':   'Peripherals',
    'tab.room':          'Room',

    'shop.level':        'lv. {v}',
    'shop.max':          'max',
    'shop.price':        '{v} ₽',
    'shop.watts':        '+{v} W',
    'shop.wattsNone':    '0 W',
    'shop.needWatts':    '{v} W short. You need a bigger power supply',
    'shop.arrow':        '{now}  →  {next}',

    'scene.tapHint':     'Tap anywhere',
    'scene.combo':       '×{v}',
    'scene.throttle':    'Overheat',
    'scene.boost':       'Boost ×{v}',
    'scene.screenTitle': 'Background render',
    'scene.screenMoney': '{v} ₽',

    'menu.stats':        'Stats',
    'menu.ach':          'Achievements',
    'menu.reset':        'Start over',
    'menu.resetTitle':   'Start over?',
    'menu.resetText':    'All hardware and money will be gone. This cannot be undone.',
    'menu.cancel':       'Cancel',
    'menu.confirm':      'Start over',
    'menu.close':        'Close',
    'menu.lang':         'Language',
    'menu.soundOn':      'Sound: on',
    'menu.soundOff':     'Sound: off',

    'stats.title':       'Stats',
    'stats.clicks':      'Clicks',
    'stats.earned':      'Earned',
    'stats.time':        'Played',
    'stats.click':       'Per click',
    'stats.sec':         'Per second',
    'stats.global':      'Global multiplier',
    'stats.crit':        'Crit chance',
    'stats.auto':        'Auto clicks/sec',
    'stats.cooling':     'Cooling',
    'stats.offline':     'Offline',
    'stats.rep':         'Reputation',
    'stats.loc':         'Location',
    'stats.orders':      'Orders delivered',
    'stats.total':       'Earned all-time',
    'stats.offlineVal':  '{p}% · up to {h} h',
    'stats.timeVal':     '{h} h {m} min',

    'cat.cpu':           'Processor',
    'cat.gpu':           'Graphics card',
    'cat.ram':           'Memory',
    'cat.ssd':           'Storage',
    'cat.psu':           'Power supply',
    'cat.cooler':        'Cooling',
    'cat.mouse':         'Mouse',
    'cat.keyboard':      'Keyboard',
    'cat.monitor':       'Monitor',
    'cat.headphones':    'Headphones',
    'cat.furniture':     'Furniture',
    'cat.rgb':           'Lighting',
    'cat.ac':            'Air conditioner',
    'cat.decor':         'Decor',

    'eff.cpu':           '{v} ₽ per click',
    'eff.gpu':           '{v} ₽/sec idle',
    'eff.ram':           'auto clicks ×{v}',
    'eff.ssd':           'offline {p}% · {h} h',
    'eff.psu':           'limit {v} W',
    'eff.cooler':        '−{v}°/sec',
    'eff.mouse':         'click ×{v} · crit {p}%',
    'eff.keyboard':      '{v} auto clicks/sec',
    'eff.keyboardNone':  'no macros',
    'eff.monitor':       'all income ×{v}',
    'eff.headphones':    'combo window {v}s',
    'eff.furniture':     'all income ×{v}',
    'eff.rgb':           'all income ×{v}',
    'eff.ac':            '−{v}°/sec · dust ×{d}',
    'eff.decor':         'all income ×{v}',

    'tier.cpu':        ['1.6 GHz junk','Dual-core','Quad-core','Six cores','Eight cores','Overclocked','Server chip','32 threads'],
    'tier.gpu':        ['Integrated','2 GB filler','Budget card','Mid-range','Gaming card','Flagship','Workstation','Dual cards'],
    'tier.ram':        ['2 GB','4 GB','8 GB','16 GB','32 GB','64 GB','128 GB','256 GB ECC'],
    'tier.ssd':        ['160 GB HDD','1 TB HDD','SATA SSD','512 GB NVMe','1 TB NVMe','2 TB NVMe','NVMe array','8 TB vault'],
    'tier.psu':        ['No-name 250 W','Office 400 W','Bronze 550 W','Gold 650 W','Gold 850 W','Platinum 1000 W','Titanium 1200 W','Titanium 1600 W'],
    'tier.cooler':     ['Stock cooler','Aluminium','Tower','Twin tower','240 AIO','360 AIO','Custom loop','Cryo loop'],
    'tier.mouse':      ['Office mouse','Gaming mouse','Wireless','Lightweight','Esports','8000 Hz','Custom sensor','Titanium'],
    'tier.keyboard':   ['Membrane','Mechanical','With macros','Hot-swap','Custom build','Lubed switches','Optical','Analog'],
    'tier.monitor':    ['CRT 1024×768','TN 60 Hz','IPS 75 Hz','IPS 144 Hz','QHD 165 Hz','Ultrawide','OLED 240 Hz','Triple screen'],
    'tier.headphones': ['Subway earbuds','Wired buds','On-ear','Over-ear','Gaming set','Studio cans','Open-back','Tube amp'],
    'tier.furniture':  ['Kitchen table','Chipboard desk','Computer desk','Office chair','Gaming chair','Standing desk','Ergonomic chair','Designer setup'],
    'tier.rgb':        ['No lighting','Shaded lamp','LED strip','RGB strip','Wall panels','Synced lighting','Room wash','Light show'],
    'tier.ac':         ['Open window','Desk fan','Floor fan','Portable AC','Split system','Inverter AC','Industrial unit','Server-room cold'],
    'tier.decor':      ['Bare walls','Poster','Figurine shelf','Cat','Plants','Neon sign','Aquarium','Collector wall']
  }
};

export const LOCALES = Object.keys(STRINGS);
/* Запасной язык, если платформа вернула что-то незнакомое. */
export const FALLBACK_LOCALE = 'en';

let current = FALLBACK_LOCALE;

export function setLocale(code){
  current = LOCALES.includes(code) ? code : FALLBACK_LOCALE;
  return current;
}
export function locale(){ return current; }

function raw(key){
  const dict = STRINGS[current];
  if(dict && key in dict) return dict[key];
  const fb = STRINGS[FALLBACK_LOCALE];
  return (fb && key in fb) ? fb[key] : key;
}

/* Выбор формы слова по числу.
   Две формы — английское правило, три — русское. Список форм задаётся
   прямо в строке, поэтому правило определяется её же языком. */
function plural(n, forms){
  if(forms.length < 2) return forms[0] || '';
  if(forms.length === 2) return Math.abs(n) === 1 ? forms[0] : forms[1];
  const a = Math.abs(Math.floor(n)) % 100, b = a % 10;
  if(a > 10 && a < 20) return forms[2];
  if(b > 1 && b < 5) return forms[1];
  if(b === 1) return forms[0];
  return forms[2];
}

/* t('shop.watts', {v: 15})                  -> '+15 Вт'
   t('order.clicks', {n: 34}) со строкой
   'Заказ: {n} {n|клик,клика,кликов}'        -> 'Заказ: 34 клика' */
export function t(key, params){
  const s = raw(key);
  if(typeof s !== 'string') return key;
  if(!params) return s;
  return s.replace(/\{(\w+)(?:\|([^}]*))?\}/g, (m, name, forms) => {
    if(!(name in params)) return m;
    if(forms === undefined) return String(params[name]);
    return plural(Number(params[name]), forms.split(','));
  });
}

/* Название уровня категории. */
export function tier(catId, level){
  const list = raw('tier.' + catId);
  if(!Array.isArray(list)) return '';
  return list[Math.max(0, Math.min(list.length - 1, level))];
}

/* ---- числа (§8: тысячи -> K, миллионы -> M) --------------------------- */
const SUFFIX = ['K', 'M', 'B', 'T', 'Q'];

export function fmt(n){
  if(!Number.isFinite(n)) return '—';
  const sign = n < 0 ? '-' : '';
  n = Math.abs(n);
  if(n < 1000) return sign + (n < 10 && n % 1 ? n.toFixed(1) : String(Math.floor(n)));
  let i = -1;
  while(n >= 1000 && i < SUFFIX.length - 1){ n /= 1000; i++; }
  return sign + (n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : Math.floor(n)) + SUFFIX[i];
}

/* Множители и другие «мелкие» числа: 1.45, 2.5, 12 */
export function fmtMult(n){
  if(!Number.isFinite(n)) return '—';
  if(n >= 1000) return fmt(n);
  return n % 1 === 0 ? String(n) : n < 10 ? n.toFixed(2).replace(/0$/, '') : n.toFixed(1);
}

export function pct(v){ return Math.round(v * 100); }

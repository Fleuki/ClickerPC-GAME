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
    'hud.cleanNone':     'Чисто',
    'hud.cleaning':      'Протри пыль: {v}',

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
    'hud.cleanNone':     'Clean',
    'hud.cleaning':      'Wipe the dust: {v}',

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

/* t('shop.watts', {v: 15}) -> '+15 Вт' */
export function t(key, params){
  const s = raw(key);
  if(typeof s !== 'string') return key;
  if(!params) return s;
  return s.replace(/\{(\w+)\}/g, (m, name) =>
    (name in params ? String(params[name]) : m));
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

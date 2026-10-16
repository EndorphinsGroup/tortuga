/**
 * Квиз «Подберём урок»: опыт × кто едет × сколько дней в Нячанге → одна рекомендация,
 * запасной вариант, цена на всех и код для бота. Цены берутся из prices.json.
 * Новичку — 2–3 урока в неделю (через день), поэтому количество уроков считаем от длины поездки.
 */
import prices from '../data/prices.json';

export type Level = 'new' | 'some' | 'pro';
export type Who = 'solo' | 'pair' | 'kid' | 'group';
export type Stay = 'week' | 'two' | 'four' | 'month';
export type State = { level: Level; who: Who; stay: Stay; pl: boolean };

export const QUESTIONS = [
  { key: 'level', legend: 'Вы уже стояли на доске?', options: [['new', 'Нет, впервые'], ['some', 'Да, пару раз'], ['pro', 'Катаюсь сам']] },
  { key: 'who', legend: 'Кто едет?', options: [['solo', 'Один'], ['pair', 'Вдвоём'], ['kid', 'С ребёнком'], ['group', 'Компания 3–4']] },
  { key: 'stay', legend: 'Сколько вы в Нячанге?', options: [['week', 'До недели'], ['two', '1–2 недели'], ['four', '2–4 недели'], ['month', 'Месяц и больше']] },
] as const;

const num = (v: string) => Number(v.replace(/\s/g, ''));
export const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/ |,/g, ' ');
const usd = (n: number) => { const x = n / 26000; return x < 20 ? Math.round(x) : Math.round(x / 5) * 5; };
const money = (n: number) => `${fmt(n)} ₫ ≈ $${usd(n)}`;

const L = Object.fromEntries(prices.lessons.map((l) => [l.id, l]));
const P = Object.fromEntries(prices.passes.rows.map((r) => [r.id, r]));
const C = Object.fromEntries(prices.courses.map((c) => [c.id, c]));
const FMT = { solo: 'individual', pair: 'pair', group: 'group', kid: 'individual' } as const;
const FMT_NAME = { individual: 'Индивидуальный урок', pair: 'Парный урок', group: 'Урок в группе' } as const;
const FMT_WHY = {
  individual: 'всё внимание инструктора вам',
  pair: 'вы вдвоём и инструктор — больше внимания, чем в группе',
  group: 'до 4 человек на инструктора',
} as const;
const PASS_WHO = { individual: 'индивидуально', pair: 'вдвоём', group: 'в группе' } as const;
const STAY_TXT = { week: 'за неделю', two: 'за 1–2 недели', four: 'за 2–4 недели', month: 'за месяц' } as const;
const lessonsWord = (n: number) => (n === 1 ? 'урок' : n < 5 ? 'урока' : 'уроков');

type Item = { id: string; title: string; unit: number; text: string };

function single(f: keyof typeof FMT_NAME): Item {
  return { id: 's', title: FMT_NAME[f], unit: num(L[f].vnd),
    text: `Один урок 2,5 часа — попробовать и понять, ваше ли это. Формат: ${FMT_WHY[f]}.` };
}
function pass(f: keyof typeof FMT_NAME, n: number, stay: Stay): Item {
  const c = P[f].cells.find((x) => x.n === n)!;
  return { id: `p${n}`, title: `Абонемент ${PASS_WHO[f]}, ${n} ${lessonsWord(n)}`, unit: num(c.vnd),
    text: `${n} ${lessonsWord(n)} ${STAY_TXT[stay]}, через день — тело успевает восстановиться. ≈ ${c.per} ₫ за урок вместо ${L[f].vnd} разово. Действует ${prices.passes.validity}.` };
}
function course(id: string): Item {
  const c = C[id];
  return { id: `k${id}`, title: `Курс ${c.name}`, unit: num(c.vnd),
    text: `${c.items.join(' + ')}. Уроки в группе, между ними аренда доски — тренируете то, что разобрали с инструктором.` };
}
function rent(): Item {
  return { id: 'rent', title: 'Аренда доски', unit: num(prices.rent.vnd),
    text: `Доска на ${prices.rent.hours} часа без инструктора — берёте под волну, сколько дней хотите. Душ, хранение вещей и парковка на базе.` };
}

/** Основная рекомендация и запасной вариант для взрослого. */
function adult(level: Level, f: keyof typeof FMT_NAME, stay: Stay): [Item, Item] {
  if (level === 'new') return ({
    week: [single(f), pass(f, 3, stay)], two: [pass(f, 3, stay), single(f)],
    four: [pass(f, 5, stay), pass(f, 7, stay)], month: [pass(f, 7, stay), pass(f, 10, stay)],
  } as const)[stay] as [Item, Item];
  if (level === 'some') return ({
    week: [single(f), course('holiday')], two: [course('holiday'), pass(f, 3, stay)],
    four: [course('junior'), pass(f, 5, stay)], month: [course('pro'), pass(f, 7, stay)],
  } as const)[stay] as [Item, Item];
  return ({
    week: [rent(), course('pro')], two: [course('pro'), rent()],
    four: [course('guru'), course('pro')], month: [course('guru'), course('pro')],
  } as const)[stay] as [Item, Item];
}

export type Result = { title: string; price: string; total: string; text: string; alt: string; extra: string; code: string; plankton: string };

export function compute(s: State): Result {
  const people = s.who === 'pair' ? 2 : 1;
  const f = FMT[s.who] as keyof typeof FMT_NAME;
  const pl = num(prices.plankton.vnd);
  let main: Item; let alt: Item; let extra = '';
  if (s.who === 'kid') {
    const kid = L.kids;
    main = { id: 'kids', title: 'Детский урок', unit: num(kid.vnd),
      text: `Ребёнку с 7 лет: до двух детей на инструктора, 1,5 часа — ${kid.vnd} ₫, 2,5 часа — 1 400 000 ₫. Берёте разово, сколько захочет ребёнок; пока он в воде, вы ждёте в тени на пляже.` };
    [alt] = adult(s.level, 'individual', s.stay);
    alt = { ...alt, title: `А вам самим: ${alt.title.charAt(0).toLowerCase()}${alt.title.slice(1)}` };
  } else {
    [main, alt] = adult(s.level, f, s.stay);
  }
  if (s.level === 'pro') extra = 'С ноября по февраль — выезды на риф для тех, кто катается сам: спросите в заявке.';
  if (s.who === 'group') extra = [extra, prices.discount].filter(Boolean).join(' ');
  const sum = main.unit * people + (s.pl ? pl * people : 0);
  const total = s.who === 'pair' ? `На двоих${s.pl ? ' с планктоном' : ''}: ${money(sum)}`
    : s.who === 'group' ? (s.pl ? `С планктоном, за человека: ${money(main.unit + pl)}` : '')
    : s.pl && main.id !== 'kids' ? `Вместе с планктоном: ${money(sum)}` : '';
  return {
    title: main.title, price: `${money(main.unit)}${main.id === 'kids' ? ' за 1,5 часа' : main.id === 'rent' ? ` за ${prices.rent.hours} часа` : ' с человека'}`,
    total, text: main.text, alt: `Или: ${alt.title} — ${money(alt.unit)}`, extra,
    code: `q-${s.level}-${s.who}-${s.stay}-${main.id}${s.pl ? '-pl' : ''}`,
    plankton: `${prices.plankton.vnd} ₫ с человека, апрель — сентябрь`,
  };
}

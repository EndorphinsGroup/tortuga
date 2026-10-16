/** Настройки квизов: вопросы, рекомендации и правила. Цены берутся из prices.json. */
import prices from '../data/prices.json';

const L = Object.fromEntries(prices.lessons.map((l) => [l.id, l]));
const P = Object.fromEntries(prices.passes.rows.map((r) => [r.id, r]));
const C = Object.fromEntries(prices.courses.map((c) => [c.id, c]));
const price = (vnd: string, usd: string, from = false) => `${from ? 'от ' : ''}${vnd} ₫ ≈ $${usd}`;
const NAME: Record<string, string> = { individual: 'Индивидуальный урок', pair: 'Парный урок', group: 'Урок в группе', kids: 'Детский урок' };
const single = (id: string, text: string, code = id) => ({ title: NAME[id], price: price(L[id].vnd, L[id].usd, !!L[id].from), text, code });
const WHO: [string, string][] = [['solo', 'Один'], ['pair', 'Вдвоём'], ['group', 'Компания 3–4'], ['kid', 'С ребёнком']];
const FMT: Record<string, string> = { solo: 'individual', pair: 'pair', group: 'group' };
const course = (id: string) => ({ title: `Курс ${C[id].name}`, price: price(C[id].vnd, C[id].usd), text: `${C[id].items.join(' + ')}. Уроки идут в группе, аренда — ваша самостоятельная практика.`, code: `k-${id}` });

export const homeQuiz = {
  bold: 'Подберём', light: 'урок',
  questions: [
    { key: 'level', legend: 'Вы уже стояли на доске?', options: [['new', 'Нет, впервые'], ['some', 'Да, пару раз'], ['pro', 'Катаюсь сам']] as [string, string][] },
    { key: 'who', legend: 'Кто едет?', options: [['solo', 'Один'], ['pair', 'Вдвоём'], ['kid', 'С ребёнком'], ['group', 'Компания 3–4']] as [string, string][] },
  ],
  recs: {
    solo: single('individual', 'Самый быстрый старт: всё внимание инструктора вам, работа под ваш темп.', 'q-solo'),
    pair: single('pair', 'Вы вдвоём и инструктор: больше внимания, чем в группе, одинаковый темп.', 'q-pair'),
    group: single('group', `До 4 человек на инструктора. ${prices.discount}`, 'q-group'),
    kid: single('kids', '1,5 или 2,5 часа, до двух детей на инструктора. Пока ребёнок в воде, вы ждёте в тени на пляже.', 'q-kid'),
    some: { title: 'Курс для продолжающих', price: `от ${prices.courses[0].vnd} ₫ ≈ $${prices.courses[0].usd}`, text: 'Уроки в группе плюс аренда доски для самостоятельной практики. Подберём курс по вашему уровню и длине отпуска.', href: '/kursy-serfinga/#podbor-kursa', cta: 'Подобрать курс' },
    pro: { title: 'Аренда доски', price: '200 000 ₫ ≈ $8', text: 'Берёте доску на базе и катаетесь сами. Лайкра, цинк, панамка, парковка и хранение вещей — на базе, кухня работает.', code: 'q-pro' },
  },
  rules: [
    { if: { level: 'pro' }, rec: 'pro' }, { if: { who: 'kid' }, rec: 'kid' }, { if: { level: 'some' }, rec: 'some' },
    { if: { who: 'group' }, rec: 'group' }, { if: { who: 'pair' }, rec: 'pair' }, { if: {}, rec: 'solo' },
  ],
};

const passRec = (who: string, n: number) => {
  const r = P[FMT[who]]; const c = r.cells.find((x) => x.n === n)!; const s = L[FMT[who]];
  return { title: `Абонемент: ${r.title.toLowerCase()}, ${n} уроков`, price: price(c.vnd, c.usd),
    text: `≈ ${c.per} ₫ за урок вместо ${s.vnd} ₫ разово. Действует ${prices.passes.validity}${n === 7 ? '. Есть и на 10 уроков — ещё дешевле за урок' : ''}.`, code: `p-${FMT[who]}${n}` };
};
export const lessonsQuiz = {
  id: 'podbor-uroka', bold: 'Сколько', light: 'уроков взять?',
  questions: [
    { key: 'count', legend: 'Сколько уроков хотите?', options: [['1', 'Один, попробовать'], ['5', '3–5 уроков'], ['7', '7–10 уроков']] as [string, string][] },
    { key: 'who', legend: 'Кто едет?', options: WHO },
  ],
  recs: {
    'kid': single('kids', '1,5 или 2,5 часа, до двух детей на инструктора. Пока ребёнок в воде, вы ждёте в тени на пляже.'),
    '1-solo': single('individual', 'Всё внимание инструктора вам — самый быстрый прогресс за одно занятие.'),
    '1-pair': single('pair', 'Вы вдвоём и инструктор: больше внимания, чем в группе, одинаковый темп.'),
    '1-group': single('group', `До 4 человек на инструктора. ${prices.discount}`),
    ...Object.fromEntries(['solo', 'pair', 'group'].flatMap((w) => [[`5-${w}`, passRec(w, 5)], [`7-${w}`, passRec(w, 7)]])),
  },
  rules: [
    { if: { who: 'kid' }, rec: 'kid' },
    ...['1', '5', '7'].flatMap((n) => ['solo', 'pair', 'group'].map((w) => ({ if: { count: n, who: w }, rec: `${n}-${w}` }))),
    { if: {}, rec: '1-solo' },
  ],
};

export const coursesQuiz = {
  id: 'podbor-kursa', rail: 'Какой курс подходит', bold: 'Какой курс', light: 'вам подходит',
  questions: [
    { key: 'exp', legend: 'Сколько уроков серфинга у вас уже было?', options: [['few', '1–2'], ['some', '3–5'], ['green', 'Катаюсь на зелёных волнах'], ['none', 'Ни одного']] as [string, string][] },
    { key: 'days', legend: 'Сколько дней вы в Нячанге?', options: [['week', 'До недели'], ['two', 'Около 2 недель'], ['month', 'Месяц и больше']] as [string, string][] },
  ],
  recs: {
    start: { title: 'Начните с урока', price: `от ${L.group.vnd} ₫ ≈ $${L.group.usd}`, text: 'Курсы — для тех, кто уже вставал на доску. Сначала урок или абонемент с инструктором, а курс — следующим шагом.', href: '/uroki-serfinga/#podbor-uroka', cta: 'Выбрать урок' },
    holiday: course('holiday'), junior: course('junior'), pro: course('pro'), guru: course('guru'),
  },
  rules: [
    { if: { exp: 'none' }, rec: 'start' },
    { if: { exp: 'few', days: 'week' }, rec: 'holiday' }, { if: { exp: 'few' }, rec: 'junior' },
    { if: { exp: 'some', days: 'week' }, rec: 'junior' }, { if: { exp: 'some' }, rec: 'pro' },
    { if: { exp: 'green', days: 'month' }, rec: 'guru' }, { if: { exp: 'green' }, rec: 'pro' },
    { if: {}, rec: 'holiday' },
  ],
};

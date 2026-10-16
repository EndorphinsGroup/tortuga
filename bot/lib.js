// Telegram-бот Tortuga: заявки с сайта + расписание для главной.
// Хранилище — Cloudflare KV (привязка BOT). Секреты: BOT_TOKEN, WEBHOOK_SECRET. ADMINS — usernames через запятую.

const TZ = 7 * 3600 * 1000; // Вьетнам, UTC+7
const KINDS = { surf: 'Урок серфинга', plank: 'Светящийся планктон' };
const WD = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const TIMES = ['07:00', '08:00', '09:00', '10:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

// Что гость выбрал на сайте: код из ссылки t.me/<бот>?start=<код>
export const LABELS = {
  individual: 'Индивидуальный урок',
  pair: 'Парный урок',
  group: 'Урок в группе',
  kids: 'Детский урок',
  rent: 'Аренда доски',
  plank: 'Светящийся планктон',
  courses: 'Абонемент / курс для продолжающих',
  'q-solo': 'Индивидуальный урок (подбор на сайте)',
  'q-pair': 'Парный урок (подбор на сайте)',
  'q-group': 'Урок в группе (подбор на сайте)',
  'q-kid': 'Детский урок (подбор на сайте)',
  'q-some': 'Абонемент на 5 уроков (подбор на сайте)',
  'q-pro': 'Аренда доски (подбор на сайте)',
  q: 'Вопрос с сайта',
};
const MENU = [['individual', '🏄 Урок серфинга'], ['courses', '📈 Абонемент / курс'], ['plank', '✨ Светящийся планктон'], ['rent', '🏄‍♂️ Аренда доски'], ['q', '💬 Другой вопрос']];

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const now = () => new Date(Date.now() + TZ); // «местное» время в UTC-полях
const ymd = (d) => d.toISOString().slice(0, 10);
const dayLabel = (s) => { const d = new Date(s + 'T00:00:00Z'); return `${WD[d.getUTCDay()]} ${s.slice(8, 10)}.${s.slice(5, 7)}`; };
const seatsLabel = (n) => (n ? `${n} ${n === 1 ? 'место' : n < 5 ? 'места' : 'мест'}` : '');

export function labelFor(code, slots = []) {
  if (!code) return null;
  if (code.startsWith('s-')) {
    const s = slots.find((x) => x.id === code.slice(2));
    return s ? `${KINDS[s.kind]} · ${dayLabel(s.date)} ${s.time}` : 'Слот из расписания (уже прошёл или удалён)';
  }
  if (/^c\d+$/.test(code)) return `Абонемент на ${code.slice(1)} уроков`;
  return LABELS[code] || 'Запись с сайта';
}

// ---------- Telegram API ----------
export const tg = (env, method, body) =>
  fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  }).then((r) => r.json());
const send = (env, chat_id, text, extra = {}) => tg(env, 'sendMessage', { chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra });

// ---------- KV ----------
const jget = async (env, k, d) => { const v = await env.BOT.get(k); return v ? JSON.parse(v) : d; };
const jput = (env, k, v, ttl) => env.BOT.put(k, JSON.stringify(v), ttl ? { expirationTtl: ttl } : undefined);

export async function getSlots(env) {
  const all = await jget(env, 'schedule', []);
  const n = now(); const today = ymd(n); const hm = n.toISOString().slice(11, 16);
  const up = all.filter((s) => s.date > today || (s.date === today && s.time > hm));
  up.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  if (up.length !== all.length) await jput(env, 'schedule', up);
  return up;
}

const adminNames = (env) => (env.ADMINS || '').split(',').map((s) => s.trim().replace(/^@/, '').toLowerCase()).filter(Boolean);
const isAdmin = (env, from) => !!from?.username && adminNames(env).includes(from.username.toLowerCase());
const adminChats = async (env) => Object.values(await jget(env, 'admins', {}));

// ---------- Клавиатуры ----------
const ADMIN_KB = { keyboard: [[{ text: '📅 Расписание' }, { text: '➕ Добавить слот' }], [{ text: '🗑 Удалить слот' }, { text: '👤 Режим гостя' }]], resize_keyboard: true };
const GUEST_KB = { keyboard: [[{ text: '📱 Оставить телефон', request_contact: true }]], resize_keyboard: true };
const ik = (rows) => ({ inline_keyboard: rows });
const chunk = (a, n) => a.reduce((r, x, i) => (i % n ? r[r.length - 1].push(x) : r.push([x]), r), []);

function scheduleText(slots) {
  if (!slots.length) return 'Расписание пустое. На сайте блок расписания сейчас скрыт.\nДобавьте слот кнопкой «➕ Добавить слот».';
  let out = '<b>Расписание на сайте</b>\n'; let cur = '';
  for (const s of slots) {
    if (s.date !== cur) { cur = s.date; out += `\n<b>${dayLabel(s.date)}</b>\n`; }
    out += `${s.time} — ${KINDS[s.kind]}${s.seats ? ` · ${seatsLabel(s.seats)}` : ''}\n`;
  }
  return out;
}

// ---------- Гость ----------
function who(from) {
  const name = esc([from.first_name, from.last_name].filter(Boolean).join(' ')) || 'Гость';
  const link = from.username ? `@${esc(from.username)}` : `<a href="tg://user?id=${from.id}">профиль</a> (без username)`;
  return `${name}, ${link}`;
}

async function notifyAdmins(env, guestId, html, copyFrom) {
  const chats = await adminChats(env);
  for (const a of chats) {
    const m = await send(env, a, html);
    if (m.ok) await jput(env, `rl:${a}:${m.result.message_id}`, guestId, 60 * 86400);
    if (copyFrom) {
      const c = await tg(env, 'copyMessage', { chat_id: a, from_chat_id: guestId, message_id: copyFrom });
      if (c.ok) await jput(env, `rl:${a}:${c.result.message_id}`, guestId, 60 * 86400);
    }
  }
  return chats.length;
}

async function guestStart(env, msg, code) {
  const chat = msg.chat.id; const slots = await getSlots(env);
  const label = labelFor(code, slots);
  if (!label) {
    return send(env, chat, 'Здравствуйте! Это <b>Tortuga Surf Camp</b>, школа серфинга на пляже Бай Дай.\nЧто вас интересует?', { reply_markup: ik(MENU.map(([c, t]) => [{ text: t, callback_data: `g:${c}` }])) });
  }
  await jput(env, `sel:${chat}`, { code, label }, 30 * 86400);
  const ask = code.startsWith('s-') ? 'Напишите, сколько вас человек, — подтвердим место.' : 'Напишите удобную дату и сколько вас человек.';
  await send(env, chat, `Здравствуйте! Это <b>Tortuga Surf Camp</b> 🏄\nВы выбрали: <b>${esc(label)}</b>.\n\n${ask} Администратор ответит здесь, обычно в течение часа (с 10:00 до 21:00 по Нячангу).`, { reply_markup: GUEST_KB });
  await notifyAdmins(env, chat, `🆕 <b>Начал запись:</b> ${esc(label)}\n${who(msg.from)}\n\n<i>Ответьте на это сообщение (Reply) — ответ уйдёт гостю.</i>`);
}

async function guestMessage(env, msg) {
  const chat = msg.chat.id;
  const sel = await jget(env, `sel:${chat}`, null);
  const head = `💬 <b>${sel ? esc(sel.label) : 'Сообщение'}</b>\n${who(msg.from)}`;
  if (msg.contact) {
    await notifyAdmins(env, chat, `${head}\n📱 Телефон: <code>${esc(msg.contact.phone_number)}</code>`);
    return send(env, chat, 'Спасибо, телефон передали администратору.', { reply_markup: { remove_keyboard: true } });
  }
  if (msg.text) await notifyAdmins(env, chat, `${head}\n\n${esc(msg.text)}`);
  else await notifyAdmins(env, chat, head, msg.message_id);
  const ackKey = `ack:${chat}`;
  if (!(await env.BOT.get(ackKey))) {
    await env.BOT.put(ackKey, '1', { expirationTtl: 1800 });
    await send(env, chat, 'Спасибо! Передал администратору, ответим здесь.');
  }
}

// ---------- Админ ----------
async function adminText(env, msg) {
  const chat = msg.chat.id; const t = (msg.text || '').trim();
  const st = await jget(env, `st:${chat}`, null);

  if (msg.reply_to_message) {
    const guest = await env.BOT.get(`rl:${chat}:${msg.reply_to_message.message_id}`);
    if (guest) {
      const r = await tg(env, 'copyMessage', { chat_id: Number(guest), from_chat_id: chat, message_id: msg.message_id });
      return send(env, chat, r.ok ? '✓ Отправлено гостю' : `Не удалось отправить: ${esc(r.description || '')}`);
    }
  }
  if (t === '📅 Расписание' || t === '/schedule') return send(env, chat, scheduleText(await getSlots(env)), { reply_markup: ADMIN_KB });
  if (t === '➕ Добавить слот' || t === '/add') {
    await jput(env, `st:${chat}`, { step: 'kind' }, 3600);
    return send(env, chat, 'Что добавляем?', { reply_markup: ik([[{ text: '🏄 Урок серфинга', callback_data: 'a:k:surf' }], [{ text: '✨ Планктон', callback_data: 'a:k:plank' }]]) });
  }
  if (t === '🗑 Удалить слот' || t === '/del') {
    const slots = await getSlots(env);
    if (!slots.length) return send(env, chat, 'Удалять нечего — расписание пустое.');
    return send(env, chat, 'Какой слот удалить?', { reply_markup: ik(slots.map((s) => [{ text: `✕ ${dayLabel(s.date)} ${s.time} · ${KINDS[s.kind]}${s.seats ? ` · ${s.seats}` : ''}`, callback_data: `del:${s.id}` }])) });
  }
  if (t === '👤 Режим гостя' || t === '/guest') {
    await env.BOT.put(`mode:${chat}`, 'guest', { expirationTtl: 86400 });
    return send(env, chat, 'Режим гостя на 24 часа: бот ведёт себя с вами как с клиентом, заявки уходят админам.\nОткройте любую кнопку записи на сайте. Вернуться: /admin', { reply_markup: { remove_keyboard: true } });
  }
  if (st?.step === 'time' && /^\d{1,2}[:.]\d{2}$/.test(t)) {
    const [h, m] = t.split(/[:.]/); const time = `${h.padStart(2, '0')}:${m}`;
    if (+h > 23 || +m > 59) return send(env, chat, 'Время в формате ЧЧ:ММ, например 06:30');
    await jput(env, `st:${chat}`, { ...st, time, step: 'seats' }, 3600);
    return askSeats(env, chat);
  }
  return send(env, chat, 'Меню ниже. Чтобы ответить гостю — сделайте Reply на его сообщение.', { reply_markup: ADMIN_KB });
}

const askSeats = (env, chat) => send(env, chat, 'Сколько свободных мест?', { reply_markup: ik([[1, 2, 3, 4].map((n) => ({ text: String(n), callback_data: `a:s:${n}` })), [{ text: 'Не указывать', callback_data: 'a:s:0' }]]) });

async function adminCallback(env, cq) {
  const chat = cq.message.chat.id; const d = cq.data; const st = await jget(env, `st:${chat}`, {});
  if (d.startsWith('a:k:')) {
    await jput(env, `st:${chat}`, { step: 'date', kind: d.slice(4) }, 3600);
    const days = Array.from({ length: 10 }, (_, i) => ymd(new Date(now().getTime() + i * 86400000)));
    return send(env, chat, 'Дата?', { reply_markup: ik(chunk(days.map((x) => ({ text: dayLabel(x), callback_data: `a:d:${x}` })), 2)) });
  }
  if (d.startsWith('a:d:')) {
    await jput(env, `st:${chat}`, { ...st, step: 'time', date: d.slice(4) }, 3600);
    return send(env, chat, 'Время? Или напишите своё, например 06:30', { reply_markup: ik(chunk(TIMES.map((x) => ({ text: x, callback_data: `a:t:${x}` })), 3)) });
  }
  if (d.startsWith('a:t:')) { await jput(env, `st:${chat}`, { ...st, step: 'seats', time: d.slice(4) }, 3600); return askSeats(env, chat); }
  if (d.startsWith('a:s:')) {
    if (!st.kind || !st.date || !st.time) return send(env, chat, 'Начните заново: «➕ Добавить слот».');
    const slots = await getSlots(env);
    slots.push({ id: Math.random().toString(36).slice(2, 8), kind: st.kind, date: st.date, time: st.time, seats: Number(d.slice(4)) || null });
    slots.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    await jput(env, 'schedule', slots); await env.BOT.delete(`st:${chat}`);
    return send(env, chat, `✓ Добавлено. Через минуту появится на сайте.\n\n${scheduleText(await getSlots(env))}`, { reply_markup: ADMIN_KB });
  }
  if (d.startsWith('del:')) {
    const slots = (await getSlots(env)).filter((s) => s.id !== d.slice(4));
    await jput(env, 'schedule', slots);
    return send(env, chat, `✓ Удалено.\n\n${scheduleText(slots)}`, { reply_markup: ADMIN_KB });
  }
}

// ---------- Вход ----------
export async function handleUpdate(env, u) {
  if (u.callback_query) {
    const cq = u.callback_query;
    await tg(env, 'answerCallbackQuery', { callback_query_id: cq.id });
    const guestMode = (await env.BOT.get(`mode:${cq.message.chat.id}`)) === 'guest';
    if (cq.data.startsWith('g:')) return guestStart(env, { chat: cq.message.chat, from: cq.from }, cq.data.slice(2));
    if (isAdmin(env, cq.from) && !guestMode) return adminCallback(env, cq);
    return;
  }
  const msg = u.message; if (!msg || msg.chat.type !== 'private') return;
  const chat = msg.chat.id; const text = msg.text || '';
  const admin = isAdmin(env, msg.from);

  if (admin) {
    const admins = await jget(env, 'admins', {});
    const key = msg.from.username.toLowerCase();
    if (admins[key] !== chat) { admins[key] = chat; await jput(env, 'admins', admins); }
    if (text === '/admin') { await env.BOT.delete(`mode:${chat}`); return send(env, chat, 'Режим администратора.', { reply_markup: ADMIN_KB }); }
    const guestMode = (await env.BOT.get(`mode:${chat}`)) === 'guest';
    if (!guestMode) {
      if (text === '/start' || text.startsWith('/start ')) return send(env, chat, '👋 Вы администратор. Сюда приходят заявки с сайта — отвечайте гостю через Reply.\nКнопками ниже ведите расписание для сайта.', { reply_markup: ADMIN_KB });
      return adminText(env, msg);
    }
  }
  if (text === '/start' || text.startsWith('/start ')) return guestStart(env, msg, text.slice(7).trim());
  return guestMessage(env, msg);
}

import site from '../data/site.json';

// Ссылка на запись через Telegram-бота. code — что выбрал гость (список в bot/lib.js → LABELS).
export const bot = (code = 'q') => `${site.bot.href}?start=${code}`;

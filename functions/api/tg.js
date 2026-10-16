// Webhook Telegram → бот. Адрес: https://<сайт>/api/tg
import { handleUpdate } from '../../bot/lib.js';

export async function onRequestPost({ request, env, waitUntil }) {
  if (request.headers.get('x-telegram-bot-api-secret-token') !== env.WEBHOOK_SECRET) return new Response('forbidden', { status: 403 });
  const update = await request.json();
  waitUntil(handleUpdate(env, update).catch((e) => console.error('bot error', e)));
  return new Response('ok');
}

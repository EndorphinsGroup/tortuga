// Разовая настройка бота: откройте https://<сайт>/api/tg-setup?key=<WEBHOOK_SECRET>
import { tg } from '../../bot/lib.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (url.searchParams.get('key') !== env.WEBHOOK_SECRET) return new Response('forbidden', { status: 403 });
  const hook = await tg(env, 'setWebhook', {
    url: `${url.origin}/api/tg`, secret_token: env.WEBHOOK_SECRET,
    allowed_updates: ['message', 'callback_query'], drop_pending_updates: true,
  });
  const cmds = await tg(env, 'setMyCommands', { commands: [{ command: 'start', description: 'Записаться / задать вопрос' }] });
  const desc = await tg(env, 'setMyDescription', { description: 'Tortuga Surf Camp — школа серфинга на пляже Бай Дай. Запись на уроки и светящийся планктон: нажмите «Старт» и напишите дату.' });
  const me = await tg(env, 'getMe', {});
  return new Response(JSON.stringify({ webhook: hook, commands: cmds.ok, description: desc.ok, bot: me.result?.username }, null, 2), { headers: { 'content-type': 'application/json' } });
}

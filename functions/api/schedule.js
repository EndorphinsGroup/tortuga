// Расписание для сайта: GET /api/schedule
import { getSlots } from '../../bot/lib.js';

export async function onRequestGet({ env }) {
  const slots = env.BOT ? await getSlots(env) : [];
  return new Response(JSON.stringify({ slots: slots.map(({ id, kind, date, time, seats }) => ({ id, kind, date, time, seats })) }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=60' },
  });
}

/** Blog helpers: published posts, dates, CTA blocks per service. */
import { getCollection, type CollectionEntry } from 'astro:content';
import prices from '../data/prices.json';

export type Post = CollectionEntry<'blog'>;

export async function posts(): Promise<Post[]> {
  const all = await getCollection('blog', (p) => !p.data.draft);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime() || (a.data.order ?? 99) - (b.data.order ?? 99));
}

export const fmtDate = (d: Date) => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

const from = (ids: string[]) => {
  const usd = (prices.lessons as { id: string; usd: string }[]).filter((l) => ids.includes(l.id)).map((l) => Number(l.usd));
  return usd.length ? `от $${Math.min(...usd)}` : '';
};

/** CTA at the end of an article — where the post sends the reader. */
export const services = {
  lessons: { title: 'Уроки серфинга на Бай Дай', text: 'Индивидуально, вдвоём или в группе до 4 человек. Трансфер из отеля, снаряжение и обед включены.', price: from(['individual', 'pair', 'group']), href: '/uroki-serfinga/', img: '/img/ph-wave.webp', btn: 'Выбрать формат' },
  courses: { title: 'Курсы для продолжающих', text: 'Для тех, кто уже вставал на доску: уроки в группе, аренда доски для самостоятельной практики, сёрфскейт и видеоразбор.', price: `от $${prices.courses[0].usd}`, href: '/kursy-serfinga/', img: '/img/ph-jump.webp', btn: 'Подобрать курс' },
  plankton: { title: 'Ночная экскурсия к светящемуся планктону', text: 'SUP-прогулка, снорклинг и BBQ-ужин на пляже Бай Дай. Трансфер из отеля включён.', price: `$${prices.plankton.usd}`, href: '/svetyashchijsya-plankton/', img: '/img/pl-sups.webp', btn: 'Узнать про экскурсию' },
  beach: { title: 'Пляж Бай Дай: как добраться', text: 'Grab, байк, автобус или трансфер школы — время в пути и цены.', price: '', href: '/plyazh-bai-dai/', img: '/img/bg-beach.webp', btn: 'Как добраться' },
} as const;

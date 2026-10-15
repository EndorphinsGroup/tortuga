import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** Статьи блога: src/content/blog/<url>.md. Имя файла = адрес статьи (/blog/<url>/). */
const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),              // <title> страницы, ключ — в начале
    h1: z.string(),                 // заголовок на странице
    description: z.string(),        // meta description и анонс в списке
    date: z.coerce.date(),          // дата публикации
    updated: z.coerce.date().optional(),
    author: z.string(),             // id из src/data/authors.json
    cover: z.string(),              // /img/...webp
    coverAlt: z.string(),
    service: z.enum(['lessons', 'courses', 'plankton', 'beach']), // куда ведёт CTA в конце
    order: z.number().optional(),  // порядок в списке среди статей с одной датой (меньше — выше)
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };

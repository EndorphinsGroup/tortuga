# Tortuga Surf Camp — сайт

Статический сайт на [Astro](https://astro.build), хостинг — Cloudflare Pages.

## Где что менять

| Что | Файл |
| --- | --- |
| Телефон, Telegram, WhatsApp, почта, адрес, меню, ссылки в футере, ссылки на отзывы | `src/data/site.json` |
| Цены уроков, «что включено», абонементы, программа курсов, «чему научитесь», блок «для тех, кто катается» | `src/data/prices.json` |
| Вопросы и ответы | `src/data/faq.json` |
| Цвета, шрифт, отступы, скругления | `src/styles/tokens.css` |
| Общие UI-компоненты: кнопки, чипы, карточки, стекло, сетки | `src/styles/global.css` |
| Шапка, футер, кнопка записи на мобильном | `src/components/Header.astro`, `Footer.astro`, `StickyBook.astro` |
| Блоки главной (каждый блок — свой файл со своими стилями и скриптом) | `src/components/home/*.astro` |
| Порядок блоков на главной, SEO-заголовок и описание | `src/pages/index.astro` |
| Картинки и видео | `public/img/`, `public/video/` |

Шапка, футер и контакты подключаются на каждую страницу из одного места: поменяли номер в `site.json` — он меняется везде.

Новая страница = новый файл в `src/pages/`, например `src/pages/uroki-serfinga/index.astro` с обёрткой `<Base title="…" description="…">…</Base>`.

## Cloudflare Pages

Settings → Build:

- Framework preset: **Astro**
- Build command: `npm run build`
- Build output directory: `dist`
- Variables: `NODE_VERSION` = `22`

После этого каждый push в `main` собирает и публикует сайт автоматически.

## Локально

```
npm install
npm run dev      # http://localhost:4321
npm run build    # готовый сайт в dist/
```

## Страница «Уроки серфинга» — /uroki-serfinga/

| Что | Файл |
| --- | --- |
| Тексты: «Как учим», таблица сравнения, шаги урока, «Если боитесь воды», детский серфинг, вопросы | `src/data/lessons.json` |
| Цены и фото форматов, «что входит», программа абонементов | `src/data/prices.json` (общие с главной) |
| Блоки страницы | `src/components/lessons/*.astro` |
| Порядок блоков, Title, description, JSON-LD | `src/pages/uroki-serfinga/index.astro` |

Шапка внутренних страниц с хлебными крошками — `src/components/PageHero.astro`, сами крошки — `Crumbs.astro`.

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

## Страница «Курсы для продолжающих» — /kursy-serfinga/

| Что | Файл |
| --- | --- |
| Тексты: «От пены к зелёным волнам», уровни курсов («подходит, если» / «научитесь»), словарь, вопросы | `src/data/courses.json` |
| Цены абонементов, блок «Катаетесь сами?» | `src/data/prices.json` (общие с главной) |
| Блоки страницы | `src/components/courses/*.astro` + общие из `home/` (Passes, Riders, Seasons, Reviews, Faq, FinalCta) |
| Порядок блоков, Title, description, JSON-LD | `src/pages/kursy-serfinga/index.astro` |

## Страница «Светящийся планктон» — /svetyashchijsya-plankton/

| Что | Файл |
| --- | --- |
| Тексты: что это, программа вечера, что входит, кому подходит, когда видно, «кусается?», что взять, цитаты гостя, вопросы | `src/data/plankton.json` |
| Цена | `src/data/prices.json` → `plankton` (общая с главной) |
| Блоки страницы | `src/components/plankton/*.astro` |
| Порядок блоков, Title, description, JSON-LD | `src/pages/svetyashchijsya-plankton/index.astro` |

Кадры `public/img/pl-*.webp` вырезаны из видеоотзыва `guest-plankton.mp4` — заменить на фото школы, когда будут.

## Страница «Пляж Бай Дай» — /plyazh-bai-dai/

| Что | Файл |
| --- | --- |
| Тексты, таблица «как добраться» (время и цены), «полезно знать», «что делать», вопросы | `src/data/beach.json` |
| Блоки страницы | `src/components/beach/*.astro` + общие Seasons, Faq, FinalCta |
| Порядок блоков, Title, description, JSON-LD | `src/pages/plyazh-bai-dai/index.astro` |

Цены на Grab, такси, байк и автобус — примерные на 2026 год, обновлять раз в сезон.

## Страница «Вопросы и ответы» — /faq/

| Что | Файл |
| --- | --- |
| Темы, порядок вопросов, вопросы только для этой страницы | `src/data/faq-page.json` |
| Ответы на остальные вопросы | там же, где они стоят на страницах: `faq.json` (главная), `lessons.json`, `courses.json`, `plankton.json`, `beach.json` — поле `from` в `faq-page.json` говорит откуда |
| Вёрстка: темы, поиск, аккордеон | `src/components/faq/FaqList.astro` |
| Сборка списка, якоря вопросов | `src/lib/faq.ts` |

Ответ, взятый через `from`, правится в исходном файле — и меняется и на странице услуги, и в FAQ. Если поменяли текст самого вопроса в исходном файле, поменяйте его и в `faq-page.json`, иначе сборка остановится с ошибкой «вопрос не найден». Ссылка на конкретный вопрос: `/faq/#<якорь>` — якорь виден в адресной строке после клика по вопросу на сайте (транслит первых слов вопроса).

## Страница «Отзывы» — /otzyvy/

| Что | Файл |
| --- | --- |
| Текстовые отзывы (имя, дата, услуга, текст, фото) | `src/data/reviews.json` → `items` |
| Площадки с отзывами (Google, Яндекс, TripAdvisor) | `src/data/site.json` → `reviews` (ссылки `#` не показываются) |
| Видеоотзывы, цитата гостя | `src/components/reviews/Videos.astro`, цитата — `plankton.json` → `quote` |

Пока `items` пустой, блок текстовых отзывов скрыт. Как только появятся отзывы — блок, фильтр по услуге (серфинг / дети / планктон) и разметка Review появятся сами. Только реальные отзывы и с согласия авторов.

## Блог — /blog/

Статья = файл `src/content/blog/<адрес>.md`, адрес страницы будет `/blog/<адрес>/`. Образец со всеми полями и примерами разметки — `src/content/blog/_primer.md` (файлы с «_» в начале на сайт не попадают).

| Поле | Что это |
| --- | --- |
| `title` / `h1` / `description` | заголовок вкладки, заголовок на странице, описание для поиска и анонса |
| `date` / `updated` | дата публикации и обновления |
| `author` | id из `src/data/authors.json` (там же имя, роль и фото автора) |
| `cover` / `coverAlt` | обложка и её описание |
| `service` | куда ведёт блок в конце статьи: `lessons`, `courses`, `plankton`, `beach` (тексты блоков — `src/lib/blog.ts`) |
| `order` | порядок в списке среди статей с одинаковой датой (меньше — выше) |
| `draft: true` | статья не публикуется |

Если статей нет, `/blog/` закрывается от индексации (`noindex`) сам. Новую статью добавить в `public/sitemap.xml`.

Картинки статей лежат в `public/img/blog/<адрес статьи>/`. Сейчас там заглушки с надписью «ЗАГЛУШКА»: чтобы заменить, положите готовую картинку в .webp с тем же именем файла. Промты для генерации — в документе проекта «Промты для картинок блога».

## Прочее

| Что | Файл |
| --- | --- |
| Политика конфиденциальности | `src/pages/privacy/index.astro` |
| Страница 404 | `src/pages/404.astro` |
| 301-редиректы со старых адресов Тильды | `public/_redirects` |
| Карта сайта | `public/sitemap.xml` — новую страницу добавлять вручную |

## Telegram-бот: заявки и расписание

Бот живёт в этом же проекте как функции Cloudflare Pages и публикуется вместе с сайтом.

| Что | Файл |
| --- | --- |
| Логика бота: тексты гостю, заявки админам, расписание | `bot/lib.js` |
| Webhook Telegram | `functions/api/tg.js` → `/api/tg` |
| Расписание для сайта (JSON) | `functions/api/schedule.js` → `/api/schedule` |
| Разовая настройка webhook | `functions/api/tg-setup.js` → `/api/tg-setup?key=…` |
| Имя бота и ссылка | `src/data/site.json` → `bot` |
| Блок «Ближайшие даты» на главной, уроках, планктоне | `src/components/Schedule.astro` |
| Ссылка записи с кодом выбора | `src/lib/bot.ts` → `bot('individual')` |

Как работает:
- Кнопка «Записаться» ведёт в бота с кодом: `t.me/<бот>?start=individual`. Коды — `bot/lib.js` → `LABELS` (`individual`, `pair`, `group`, `kids`, `rent`, `plank`, `courses`, `c5`, `q-solo`…, `s-<слот>`).
- Гость видит, что выбрал, пишет дату. Админам приходит заявка с именем и ссылкой на гостя; ответ через Reply уходит гостю от имени бота.
- Админы (`ADMINS`) ведут расписание: присылают боту тот же текст, что в сторис (`16 октября - 7:00`, можно вместе с картинкой), бот разбирает даты и просит подтвердить. Время — выезд из города. Есть и кнопки «➕ Добавить слот» / «🗑 Удалить слот». Через минуту слоты появляются на сайте, прошедшие удаляются сами.
- «👤 Режим гостя» — админ на 24 часа видит бота как клиент (для теста), `/admin` — назад.

Настройка в Cloudflare Pages (Settings):
1. Workers KV → создать namespace `tortuga-bot`; Settings → Bindings → KV namespace: имя переменной `BOT`.
2. Variables and Secrets: `BOT_TOKEN` (секрет, от @BotFather), `WEBHOOK_SECRET` (секрет, любая длинная строка из букв и цифр), `ADMINS` = `Dikii_Voodoo,luffy19413`.
3. Передеплоить сайт, открыть `https://<сайт>/api/tg-setup?key=<WEBHOOK_SECRET>` — бот подключён.
4. Каждый админ один раз жмёт в боте «Старт».

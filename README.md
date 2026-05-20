# Harmony School CRM

Учебный проект с нуля на тему **«Музыкальная школа»**. Это standalone React-приложение без VK: при входе показывает Yandex SmartCaptcha, затем открывает CRM для администратора школы.

## Что реализовано

- вход через Yandex SmartCaptcha;
- serverless-проверка капчи в `api/verify-captcha.js` для Vercel;
- добавление, редактирование, поиск и удаление учеников;
- создание тарифов и выдача абонементов;
- контроль оставшихся занятий, оплат и долгов;
- расписание занятий с отметкой «проведено»;
- dashboard со статистикой;
- адаптивный дизайн для ноутбука и телефона;
- бесплатное хранение через Supabase Free Tier;
- demo-режим без ключей: данные сохраняются в `localStorage`, чтобы проект сразу запускался.

## Быстрый запуск

```bash
npm install
npm start
```

Без переменных окружения приложение откроется в demo-режиме: вместо реальной капчи будет кнопка входа, а база будет храниться в браузере.

## Переменные окружения

Скопируйте `.env.example` в `.env.local` для локального запуска или добавьте эти значения в Vercel/Netlify:

```env
REACT_APP_YANDEX_CAPTCHA_SITE_KEY=public-site-key
YANDEX_CAPTCHA_SECRET_KEY=server-secret-key
REACT_APP_SUPABASE_URL=https://project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=anon-key
REACT_APP_SUPABASE_TABLE=music_school_data
```

`REACT_APP_YANDEX_CAPTCHA_SITE_KEY` — публичный ключ виджета.  
`YANDEX_CAPTCHA_SECRET_KEY` — секретный ключ, хранится только на хостинге и используется serverless-функцией `/api/verify-captcha`.

## Supabase Free: таблица базы данных

Создайте бесплатный проект на Supabase и выполните SQL в разделе **SQL Editor**:

```sql
create table if not exists public.music_school_data (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.music_school_data enable row level security;

create policy "Allow anon read music school demo data"
on public.music_school_data
for select
to anon
using (true);

create policy "Allow anon upsert music school demo data"
on public.music_school_data
for insert
to anon
with check (true);

create policy "Allow anon update music school demo data"
on public.music_school_data
for update
to anon
using (true)
with check (true);
```

Для учебного проекта используется одна JSON-строка `id = 'default'`. Для реальной школы лучше добавить авторизацию и отдельные таблицы `students`, `plans`, `subscriptions`, `lessons`.

## Деплой не локально

### Vercel, бесплатно

1. Загрузите проект на GitHub.
2. Создайте проект на [vercel.com](https://vercel.com) из репозитория.
3. Build command: `npm run build`.
4. Output directory: `build`.
5. Добавьте переменные окружения из `.env.example`.
6. Нажмите **Deploy**.

`vercel.json` уже настроен для React SPA и serverless API.

### Netlify, бесплатно

Frontend можно развернуть на Netlify с теми же build settings. Для строгой серверной проверки SmartCaptcha на Netlify понадобится перенести `api/verify-captcha.js` в Netlify Functions или использовать Vercel для проекта целиком.

## Скрипты

```bash
npm start   # локальная разработка
npm test    # тесты
npm run build # production-сборка
```

## Структура

```text
api/verify-captcha.js  # serverless-проверка Yandex SmartCaptcha
src/App.js             # вся логика CRM
src/App.css            # адаптивная стилизация
.env.example           # шаблон переменных окружения
vercel.json            # бесплатный деплой на Vercel
```

# Solfejio — CRM для музыкальной школы

Учебный React-проект для администрирования музыкальной школы: вход через Яндекс SmartCaptcha, база учеников, абонементы, расписание занятий и учет оставшихся уроков.

## Что реализовано

- стартовый экран с Яндекс SmartCaptcha;
- учебный fallback-кнопка капчи, если ключ не задан, чтобы проект запускался сразу;
- добавление, просмотр и удаление учеников;
- создание абонементов по тарифам;
- планирование занятий;
- отметка занятия проведенным с автоматическим уменьшением остатка по абонементу;
- статистика по ученикам, активным абонементам, занятиям и выручке;
- адаптивный интерфейс в стиле премиальной музыкальной школы;
- локальное резервное сохранение в браузере;
- опциональное облачное хранение в Supabase Free через защищенную Netlify Function;
- конфиг для бесплатного деплоя на Netlify и существующий конфиг VK Hosting.

## Быстрый запуск

```bash
npm install
npm start
```

Без переменных окружения приложение работает в демо-режиме: капча проходится учебной кнопкой, данные сохраняются в `localStorage`.

## Переменные окружения

Скопируйте пример:

```bash
cp .env.example .env
```

```env
REACT_APP_YANDEX_CAPTCHA_SITEKEY=your_yandex_smartcaptcha_client_key
REACT_APP_CLOUD_API_URL=/.netlify/functions/school-state
REACT_APP_SUPABASE_STATE_ID=music-school-demo
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
YANDEX_CAPTCHA_SERVER_KEY=your_yandex_smartcaptcha_server_key
CLOUD_SESSION_SECRET=generate_a_long_random_secret
```

### Яндекс SmartCaptcha

1. Создайте капчу в Yandex Cloud SmartCaptcha.
2. Добавьте домен деплоя в разрешенные домены.
3. Укажите клиентский ключ в `REACT_APP_YANDEX_CAPTCHA_SITEKEY`.

На Netlify токен дополнительно проверяется серверной функцией `netlify/functions/school-state.js`, поэтому секретный ключ SmartCaptcha не попадает в браузер.

### Supabase Free

1. Создайте бесплатный проект Supabase.
2. Откройте SQL Editor.
3. Выполните содержимое `supabase-schema.sql`. В таблице включен RLS, а публичные `anon/authenticated` роли не получают доступ к данным.
4. Возьмите `Project URL` и `service_role key` из Project Settings → API.
5. Добавьте `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `YANDEX_CAPTCHA_SERVER_KEY` и `CLOUD_SESSION_SECRET` в env на Netlify.
6. Не добавляйте `service_role key` в переменные с префиксом `REACT_APP_`: такие значения попадут в браузер.

## Бесплатный деплой

### Netlify

1. Подключите репозиторий к Netlify.
2. Build command: `npm run build`.
3. Publish directory: `build`.
4. Добавьте env-переменные из `.env.example`: `REACT_APP_*` доступны сборке, остальные используются только Netlify Function.
5. Deploy.

Файл `netlify.toml` уже добавлен.

### VK Hosting

В репозитории оставлен `vk-hosting-config.json`. После получения сервисного ключа VK Mini Apps:

```bash
npm run build
npx vk-miniapps-deploy deploy <VK_SERVICE_TOKEN> --no-update-test-group
```

## Проверка

```bash
npm test -- --watchAll=false
npm run build
```

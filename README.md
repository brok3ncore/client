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
- опциональное облачное хранение в Supabase Free через REST API;
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
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_SUPABASE_STATE_ID=music-school-demo
```

### Яндекс SmartCaptcha

1. Создайте капчу в Yandex Cloud SmartCaptcha.
2. Добавьте домен деплоя в разрешенные домены.
3. Укажите клиентский ключ в `REACT_APP_YANDEX_CAPTCHA_SITEKEY`.

В учебном frontend-only проекте проверяется получение токена виджета. Для боевого проекта токен нужно дополнительно проверять на сервере через секретный ключ SmartCaptcha.

### Supabase Free

1. Создайте бесплатный проект Supabase.
2. Откройте SQL Editor.
3. Выполните содержимое `supabase-schema.sql`.
4. Возьмите `Project URL` и `anon public key` из Project Settings → API.
5. Добавьте эти значения в env на хостинге.

## Бесплатный деплой


### GitHub Pages

В проект добавлен workflow `.github/workflows/pages.yml`. После merge в `master` GitHub Actions соберет `npm run build` и опубликует статический сайт на GitHub Pages.

1. В настройках репозитория откройте Settings → Pages.
2. Source: `GitHub Actions`.
3. При необходимости добавьте Repository variables с именами из `.env.example`.
4. Запустите workflow вручную или сделайте push в `master`.

Ожидаемый бесплатный адрес: `https://brok3ncore.github.io/client/`.

### Netlify

1. Подключите репозиторий к Netlify.
2. Build command: `npm run build`.
3. Publish directory: `build`.
4. Добавьте env-переменные из `.env.example`.
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

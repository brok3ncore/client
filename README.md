# 🎵 Music Studio CRM — VK Mini App
![VK Mini App](https://img.shields.io/badge/VK-Mini%20App-0077ff?style=for-the-badge&logo=vk&logoColor=white)
![React](https://img.shields.io/badge/React-18.2.0-61dafb?style=for-the-badge&logo=react&logoColor=white)
![VKUI](https://img.shields.io/badge/VKUI-5.0.0-0077ff?style=for-the-badge&logo=vk&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
> **CRM-система для музыкальной студии** в виде мини-приложения для социальной сети ВКонтакте. Управляйте клиентами, записями и финансами прямо в VK с любого устройства.

## 📱 Ссылка на приложение
[https://vk.com/app54569233](https://vk.com/app54569233)
---
## ✨ Функционал
| Функция | Описание |
|---------|----------|
| 👥 **Управление клиентами** | Добавление, просмотр и учёт истории посещений клиентов |
| 🎵 **Управление записями** | Создание бронирований с выбором услуги и длительности |
| 💰 **Финансовый учёт** | Автоматический подсчёт выручки и трат каждого клиента |
| 📊 **Дашборд со статистикой** | Клиенты, активные записи, общая выручка |
| ⚡ **Быстрые действия** | Добавление клиента/записи в два клика |
| ✅ **Завершение записей** | Отметка выполненных работ |
| 🔐 **Авторизация через VK ID** | Быстрый и безопасный вход |
| ☁️ **Облачное хранение** | Все данные сохраняются в VK Storage |

---
## 🎧 Доступные услуги
| Услуга | Цена (в час) |
|--------|--------------|
| 🎙️ Запись вокала | 1 500 ₽ |
| 🎚️ Сведение | 5 000 ₽ |
| ✨ Мастеринг | 3 000 ₽ |
| 🥁 Репетиция | 800 ₽ |
| 🎸 Инструментал | 2 000 ₽ |
| 💡 Консультация | 1 000 ₽ |
---
## 🛠️ Технологии
| Категория | Технология | Версия |
|-----------|------------|--------|
| **Frontend** | React | 18.2.0 |
| **UI-библиотека** | VKUI | 5.0.0 |
| **API-коммуникация** | VK Bridge | 4.0.0 |
| **Хранение данных** | VK Storage API | — |
| **Хостинг** | VK Hosting | — |
| **Сборка** | React Scripts | 5.0.1 |
---

## 📁 Структура проекта
## 🚀 Установка и запуск

### 1. Клонирование репозитория
```bash
git clone https://github.com/your-username/music-studio-crm.git
cd music-studio-crm/client

**2. Установка зависимостей**
bash
npm install

**3. Запуск в режиме разработки**
bash
npm start
Приложение откроется по адресу http://localhost:3000

**4. Сборка production-версии**b
bash
npm run build
**5. Деплой на VK Hosting**
bash
npm run deploy
🔧 Настройка деплоя

**1. Создайте файл vk-hosting-config.json**
json
{
  "static_path": "build",
  "app_id": "ВАШ_ID_ПРИЛОЖЕНИЯ",
  "endpoints": {
    "mobile": "index.html",
    "mvk": "index.html",
    "web": "index.html"
  }
}

**2. Добавьте скрипты в package.json**
json
"scripts": {
  "start": "react-scripts start",
  "build": "react-scripts build",
  "predeploy": "npm run build",
  "deploy": "vk-miniapps-deploy"
}

**3. Деплой с сервисным ключом**
bash
npx vk-miniapps-deploy deploy ВАШ_СЕРВИСНЫЙ_КЛЮЧ --no-update-test-group
📊 Архитектура
text
┌─────────────────────────────────────────────────────────────┐
│                      VK MINI APP (Фронтенд)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   React     │  │    VKUI     │  │  VK Bridge  │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼────────────────┼────────────────┼────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                      API VK (Бесплатно)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  VK Auth    │  │ VK Storage  │  │ VK Hosting  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
🗄️ Хранение данных (VK Storage)

javascript
// Загрузка данных
const storageData = await bridge.send('VKWebAppStorageGet', {
    keys: [`crm_clients_${userId}`, `crm_bookings_${userId}`]
});

// Сохранение данных
await bridge.send('VKWebAppStorageSet', { 
    key: `crm_clients_${userId}`, 
    value: JSON.stringify(clients) 
});

📈 Статистика проекта
Показатель	Значение
Количество компонентов	8
Объём кода	1 200+ строк
UI-компонентов VKUI	20+
API-вызовов VK Bridge	3 типа
Хранилище	100 МБ на пользователя
Платформы	iOS, Android, Web

📝 Лицензия
MIT License

**👨‍💻 Автор**
Филатов Тимур Денисович

**Группа: 9/3-РПО-23/1-Ш**

**Специальность: 09.02.07 Информационные системы и программирование**

**🙏 Благодарности**
Команде VK за отличную документацию VK Bridge и VKUI

Преподавателям колледжа "Академия ТОП" за ценные советы

🔗 Ссылка на приложение: https://vk.com/app54569233

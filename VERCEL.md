# Деплой TymMovie на Vercel

Один проект: фронтенд (React) + serverless API (Neon + TMDB). Отдельный бэкенд не нужен.

## Подключение репозитория к Vercel

1. Зайдите на [vercel.com](https://vercel.com) и войдите через GitHub.

2. **Add New Project** → **Import Git Repository** → выберите **Damodar1992/TymMovie**.

3. **Настройки:**
   - **Framework Preset:** Vite.
   - **Root Directory:** укажите `frontend`.
   - **Build Command:** `npm run build`.
   - **Output Directory:** `dist`.
   - **Install Command:** `npm install`.

4. **Переменные окружения (обязательно):**
   - `DATABASE_URL` — строка подключения к Neon PostgreSQL (например: `postgresql://user:pass@host/db?sslmode=require`).
   - `TMDB_API_KEY` — Bearer-токен The Movie Database (для подтягивания постеров и метаданных).

5. Нажмите **Deploy**. После сборки приложение и API будут доступны на одном домене (например `https://xxx.vercel.app`).

## Локальная разработка

- Установите зависимости: `cd frontend && npm install`.
- Скопируйте `frontend/.env.example` в `frontend/.env` и заполните `DATABASE_URL` и `TMDB_API_KEY`.
- Запуск: `npm run dev` в папке `frontend` — поднимаются **Vite** и локальный API-сервер (те же обработчики, что и на Vercel). Vercel для локальной разработки не нужен.
- Только фронтенд: `npm run dev:only` (запросы к `/api` без запущенного API не сработают).

## База данных

Таблица `movies` должна существовать в Neon. Миграции из старого бэкенда можно выполнить вручную (SQL из миграций) или создать таблицу по той же схеме. Ключ и индексы: `id` (UUID), `title`, `title_normalized`, `original_title`, `imdb_id`, `poster_url`, `genres` (JSONB), `imdb_rating`, `inna_rating`, `bogdan_rating`, `user_avg_rating`, `status`, `watch_date`, `source_provider`, `source_payload`, `created_at`, `updated_at`.

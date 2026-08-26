# Деплой TymMovie на Vercel

Один проект: фронтенд (React) + serverless-функции (`frontend/api/`) для Neon и TMDb. Отдельный
процесс-бэкенд разворачивать не нужно — функции деплоятся вместе с фронтендом на Vercel.

## Подключение репозитория к Vercel

1. Зайдите на [vercel.com](https://vercel.com) и войдите через GitHub.

2. **Add New Project** → **Import Git Repository** → выберите репозиторий проекта.

3. **Настройки:**
   - **Framework Preset:** Vite.
   - **Root Directory:** укажите `frontend`.
   - **Build Command:** `npm run build`.
   - **Output Directory:** `dist`.
   - **Install Command:** `npm install`.

4. **Переменные окружения (обязательно, без префикса `VITE_` — их читают только serverless-функции):**
   - `DATABASE_URL` — строка подключения к Neon PostgreSQL.
   - `TMDB_API_KEY` — Bearer-токен The Movie Database.
   - `ADMIN_LOGIN` / `ADMIN_PASSWORD` — логин и пароль для входа в приложение.
   - `AUTH_SECRET` — длинная случайная строка для подписи сессионной cookie (например,
     `openssl rand -base64 32`). Смена секрета обнуляет все текущие сессии.

   Добавьте их и для Production, и для Preview окружений.

5. Нажмите **Deploy**. После сборки приложение и `/api/*` будут доступны на одном домене
   (например `https://xxx.vercel.app`).

## Локальная разработка

- Установите зависимости: `cd frontend && npm install`.
- Скопируйте `frontend/.env.example` в `frontend/.env` и заполните все переменные (см. выше).
- Локально нужен Vercel CLI, чтобы serverless-функции из `frontend/api/` поднимались рядом с Vite:
  ```bash
  npm i -g vercel   # один раз
  cd frontend && vercel dev
  ```
  `vercel dev` сам подхватит `frontend/.env` для функций и будет проксировать `/api/*` на них.
- Просто фронтенд без функций: `npm run dev` (запросы к `/api/*` работать не будут — экран логина
  и данные не загрузятся, это ожидаемо при таком запуске).

## База данных

Таблица `movies` создаётся и обновляется миграциями из `frontend/migrations/`, а не вручную:

```bash
cd frontend && npm run migrate
```

Скрипт применяет ещё не применённые файлы по порядку и отмечает их в служебной таблице
`_migrations`, так что его безопасно перезапускать. Актуальный список колонок: `id` (UUID),
`content_type`, `title`, `title_normalized`, `original_title`, `title_ua`, `tmdb_id`, `poster_url`,
`genres` (JSONB), `tmdb_rating`, `release_year`, `inna_rating`, `bogdan_rating`, `user_avg_rating`,
`comment_text`, `status`, `watch_date`, `created_at`, `updated_at`.

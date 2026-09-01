# Деплой TymMovies на Vercel

Один проект: фронтенд (React) + serverless-функции (`frontend/api/`) для Neon, TMDb и Google OAuth.
Отдельный процесс-бэкенд разворачивать не нужно — функции деплоятся вместе с фронтендом на Vercel.

## Google OAuth клиент

1. Откройте [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. Создайте **OAuth client ID** типа **Web application**.
3. В **Authorized redirect URIs** добавьте по одному URI на каждое окружение, которым будете
   пользоваться, например:
   - `http://localhost:5173/api/auth/google-callback` — локальная разработка;
   - `https://your-app.vercel.app/api/auth/google-callback` — продакшн-домен на Vercel.
4. Сохраните `Client ID` и `Client secret` — они понадобятся ниже как `GOOGLE_CLIENT_ID` и
   `GOOGLE_CLIENT_SECRET`.

Вход открыт для любого Google-аккаунта — allowlist по email не используется. Новый пользователь
при первом входе получает свой пустой личный список и не видит чужие данные, пока не перейдёт по
ссылке-инвайту от владельца другого списка.

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
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — из OAuth-клиента, созданного выше.
   - `GOOGLE_REDIRECT_URI` — должен **точно** совпадать с одним из Authorized redirect URIs
     клиента, например `https://your-app.vercel.app/api/auth/google-callback`.
   - `AUTH_SECRET` — длинная случайная строка для подписи сессионной cookie и OAuth-параметра
     `state` (например, `openssl rand -base64 32`). Смена секрета обнуляет все текущие сессии.

   Добавьте их и для Production, и для Preview окружений. Если используете несколько доменов
   (например, свой Preview-URL), для каждого нужен свой `GOOGLE_REDIRECT_URI` и соответствующий
   Authorized redirect URI на стороне Google.

5. Нажмите **Deploy**. После сборки приложение и `/api/*` будут доступны на одном домене
   (например `https://xxx.vercel.app`).

## Локальная разработка

- Установите зависимости: `cd frontend && npm install`.
- Скопируйте `frontend/.env.example` в `frontend/.env` и заполните все переменные (см. выше).
- Запускайте как обычно:
  ```bash
  cd frontend && npm run dev
  ```
  Vercel CLI и аккаунт Vercel для этого не нужны. Dev-only плагин Vite (`frontend/dev-api-plugin.ts`)
  сам поднимает `frontend/api/*` на том же порту, что и React-приложение, и подтягивает
  `frontend/.env` в `process.env`. В сборку (`npm run build`) этот плагин не попадает — на проде
  `api/*` продолжает собирать и обслуживать сам Vercel, используя ровно те же файлы обработчиков.

## База данных

Схема создаётся и обновляется миграциями из `frontend/migrations/`, а не вручную:

```bash
cd frontend && npm run migrate
```

Скрипт применяет ещё не применённые файлы по порядку и отмечает их в служебной таблице
`_migrations`, так что его безопасно перезапускать.

Основные таблицы после миграций 0001–0009:

- `users` — учётные записи (`google_sub`, `email`, `name`, `avatar_url`).
- `movies` — общий кэш метаданных TMDb (`tmdb_id`, `content_type`, `title`, `poster_url`,
  `genres`, `tmdb_rating`, ...), без пользовательских оценок и статусов.
- `lists` — список фильмов, у каждого есть `owner_id`.
- `list_members` — участники списка (`role`: `owner` / `member`, задел под будущий `viewer`).
- `list_movies` — фильм внутри конкретного списка: `status`, `watch_date`, `comment_text`.
- `list_movie_ratings` — персональная оценка каждого участника по каждому фильму в списке
  (`user_id`, `rating`, `rated_by` — кто фактически ввёл оценку).
- `list_invites` — ссылки-инвайты (`token`, `role`, без срока действия, отзываются вручную).

### Перенос старых данных (Bohdan / Inna)

Старая таблица `movies` с колонками `inna_rating`/`bogdan_rating` мигрируется в новую модель
одноразовым скриптом `frontend/scripts/backfill-lists.mjs` (не часть `npm run migrate`, запускается
вручную с параметрами `--owner-email`, `--member-email` и т.д.). После проверки результата колонки
`status`/`watch_date`/`inna_rating`/`bogdan_rating`/`user_avg_rating`/`comment_text` можно удалить из
`movies` вручную через `frontend/scripts/post-backfill-slim-movies.sql`.

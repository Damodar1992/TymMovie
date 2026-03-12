# Деплой TymMovie на Vercel

## Подключение репозитория GitHub к Vercel

1. **Войдите на [vercel.com](https://vercel.com)** и авторизуйтесь через GitHub.

2. **Add New Project** → **Import Git Repository** → выберите **Damodar1992/TymMovie** (или нажмите **Import** рядом с ним).

3. **Настройки проекта:**
   - **Framework Preset:** Vite (должен определиться автоматически).
   - **Root Directory:** нажмите **Edit** и укажите `frontend` (важно — в репозитории фронтенд лежит в папке `frontend`).
   - **Build Command:** `npm run build` (по умолчанию).
   - **Output Directory:** `dist` (по умолчанию).
   - **Install Command:** `npm install` (по умолчанию).

4. **Переменные окружения (Environment Variables):**
   - Если бэкенд уже развёрнут на другом сервисе (Railway, Render и т.п.), добавьте:
     - **Name:** `VITE_API_BASE_URL`
     - **Value:** полный URL бэкенда, например `https://your-app.railway.app/api` (без слэша в конце).
   - Если бэкенд пока не развёрнут, переменную можно не задавать — после деплоя бэкенда добавьте её в Vercel и сделайте **Redeploy**.

5. Нажмите **Deploy**. После сборки приложение будет доступно по ссылке вида `https://tym-movie-xxx.vercel.app`.

---

## Важно

- На Vercel развёртывается только **фронтенд** (React). Бэкенд (NestJS + БД) нужно разворачивать отдельно (например, [Railway](https://railway.app), [Render](https://render.com), [Fly.io](https://fly.io)).
- После деплоя бэкенда укажите его URL в `VITE_API_BASE_URL` в настройках проекта Vercel и пересоберите проект (Redeploy).

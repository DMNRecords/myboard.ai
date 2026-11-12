# Подключение Supabase для локальной разработки

Этот проект не создаёт облачные ресурсы автоматически. Выполните следующие шаги в
отдельном Supabase-проекте для local/staging; не используйте production-ключи локально.

## 1. Создайте локальную конфигурацию

Скопируйте `.env.example` в `.env.local` и заполните только значения вашего проекта:

```text
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

`SUPABASE_SERVICE_ROLE_KEY` для текущего приложения не нужен. Не добавляйте его в
клиентский код, `NEXT_PUBLIC_*` переменные или Git.

## 2. Настройте Auth URL

В Supabase Dashboard откройте Authentication → URL Configuration и добавьте:

- Site URL: `http://localhost:3000` для local-разработки;
- Redirect URL: `http://localhost:3000/auth/callback`.

Для staging и production добавьте их собственные HTTPS URL и соответствующий
`/auth/callback`. Не отключайте подтверждение email для production без отдельного
решения.

## 3. Примените миграцию в local или staging

Примените [первую миграцию](../supabase/migrations/20261112120000_create_game_projects.sql)
через Supabase CLI или SQL Editor выбранного **не-production** проекта. Она создаёт
`public.game_projects`, RLS-политики владельца и автоматическое обновление `updated_at`.

Проверьте, что RLS остаётся включённым и у роли `authenticated` есть доступ только через
эти политики.

## 4. Запустите и проверьте сценарий

```bash
pnpm dev
```

Откройте `http://localhost:3000/login`, зарегистрируйтесь с паролем от 12 символов,
подтвердите email и создайте проект на `/projects`.

Если подтверждение не возвращает на сайт, проверьте, что Redirect URL в Auth URL
Configuration в точности соответствует адресу приложения и заканчивается на
`/auth/callback`.

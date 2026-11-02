# Architecture decisions
## ADR-000 Product scope — Accepted
MVP без 3D. Studio 3D — отдельный будущий этап.
## ADR-001 Stack — Accepted
Для MVP принимаем Next.js (App Router) + TypeScript в строгом режиме, PostgreSQL/Auth/private object storage через Supabase, серверный AI adapter и серверный PDF module. В качестве package manager используется pnpm 11, runtime — Node.js 24.

Next.js используется как BFF и application layer: Server Components для чтения, Server Actions для защищённых мутаций интерфейса и Route Handlers для публичных HTTP-точек (вебхуки, интеграции). Долгие AI-генерации и тяжёлый PDF не выполняются в request lifecycle; при их появлении вводится отдельный worker/queue.

Supabase остаётся инфраструктурным адаптером: доменная и entitlement-логика не располагается в браузере и не привязывается к UI.
Alternative: Next.js + отдельный FastAPI backend. Не добавлять без конкретной необходимости.
## ADR-002 Modular monolith — Accepted
Один deployable app с ясными доменными границами; выделять workers/services только при необходимости. Границы модулей: Identity, Projects, Game Domain, Game Revisions, AI Orchestration, Moderation, Entitlements & Billing, Export, Admin & Observability.
## ADR-003 AI adapter — Accepted
Все AI вызовы идут через серверный адаптер; провайдер и модели можно заменить. Никаких ключей API в браузере.

## ADR-004 Game revisions — Accepted
Проект игры — изменяемый контейнер. Каждая подтверждённая редакция игры — неизменяемый snapshot структурированной Game Schema с собственным `schema_version`, источником изменения и метаданными генерации. Это обеспечивает воспроизводимый PDF-экспорт, откат и аудит без преждевременного event sourcing.

## ADR-005 MVP boundary — Accepted
MYBOARD STUDIO 3D остаётся Stage 7. В MVP не создаются 3D-модели, миграции, API, viewer, экспорты или зависимости. Единственный допустимый задел — серверный feature flag `studio_3d_enabled=false`, когда появится система feature flags.

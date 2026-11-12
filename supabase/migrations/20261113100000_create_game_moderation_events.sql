create table public.game_moderation_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.game_projects (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  reason text not null check (char_length(btrim(reason)) between 1 and 240),
  created_at timestamptz not null default now()
);

create index game_moderation_events_owner_project_created_idx
  on public.game_moderation_events (owner_id, project_id, created_at desc);

alter table public.game_moderation_events enable row level security;

grant select, insert on public.game_moderation_events to authenticated;

create policy "Owners can select their moderation events"
on public.game_moderation_events
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Owners can create their moderation events"
on public.game_moderation_events
for insert
to authenticated
with check (
  (select auth.uid()) = owner_id
  and exists (
    select 1 from public.game_projects
    where game_projects.id = project_id
      and game_projects.owner_id = (select auth.uid())
  )
);

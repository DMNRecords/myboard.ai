create table public.game_ai_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.game_projects (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(btrim(content)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index game_ai_messages_owner_project_created_idx
  on public.game_ai_messages (owner_id, project_id, created_at);

alter table public.game_ai_messages enable row level security;

grant select, insert on public.game_ai_messages to authenticated;

create policy "Owners can select their AI messages"
on public.game_ai_messages
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Owners can create their AI messages"
on public.game_ai_messages
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

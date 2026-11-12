create table public.game_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.game_projects (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  version integer not null check (version >= 1),
  content jsonb not null,
  created_at timestamptz not null default now(),
  unique (project_id, version)
);

create index game_versions_owner_id_project_id_version_idx
  on public.game_versions (owner_id, project_id, version desc);

alter table public.game_versions enable row level security;

grant select, insert on table public.game_versions to authenticated;

create policy "Owners can select their game versions"
on public.game_versions
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Owners can create their game versions"
on public.game_versions
for insert
to authenticated
with check (
  (select auth.uid()) = owner_id
  and exists (
    select 1
    from public.game_projects
    where game_projects.id = project_id
      and game_projects.owner_id = (select auth.uid())
  )
);

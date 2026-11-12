create table public.game_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text,
  language text not null check (language in ('ru', 'kk', 'en')),
  style text,
  status text not null default 'draft' check (status in ('draft', 'archived')),
  version integer not null default 1 check (version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint game_projects_archival_state_check check (
    (status = 'draft' and archived_at is null)
    or (status = 'archived' and archived_at is not null)
  )
);

create index game_projects_owner_id_created_at_idx
  on public.game_projects (owner_id, created_at desc);

create function public.set_game_projects_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_game_projects_updated_at
before update on public.game_projects
for each row
execute function public.set_game_projects_updated_at();

alter table public.game_projects enable row level security;

grant select, insert, update, delete on table public.game_projects to authenticated;

create policy "Owners can select their game projects"
on public.game_projects
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Owners can create their game projects"
on public.game_projects
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create policy "Owners can update their game projects"
on public.game_projects
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "Owners can delete their game projects"
on public.game_projects
for delete
to authenticated
using ((select auth.uid()) = owner_id);

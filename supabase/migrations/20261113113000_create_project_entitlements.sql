create table public.project_entitlements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.game_projects(id) on delete cascade,
  capability text not null check (capability in ('pdf_export')),
  source text not null check (source in ('beta', 'payment', 'admin')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at is null or expires_at > starts_at)
);

create index project_entitlements_owner_project_idx
  on public.project_entitlements (owner_id, project_id, capability, status);

alter table public.project_entitlements enable row level security;

create policy "Owners can read their project entitlements"
  on public.project_entitlements
  for select
  using (auth.uid() = owner_id);

comment on table public.project_entitlements is
  'Server-managed access rights. Client roles may read only their own rows; grants are issued by billing or an admin service.';

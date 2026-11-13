insert into storage.buckets (id, name, public)
values ('game-assets', 'game-assets', true)
on conflict (id) do nothing;

create policy "Owners can upload their game assets"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'game-assets'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

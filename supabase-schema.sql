create table if not exists public.user_collections (
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  payload jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, name)
);

alter table public.user_collections enable row level security;

drop policy if exists "user_collections_select_own" on public.user_collections;
create policy "user_collections_select_own"
on public.user_collections
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "user_collections_insert_own" on public.user_collections;
create policy "user_collections_insert_own"
on public.user_collections
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "user_collections_update_own" on public.user_collections;
create policy "user_collections_update_own"
on public.user_collections
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "user_collections_delete_own" on public.user_collections;
create policy "user_collections_delete_own"
on public.user_collections
for delete
to authenticated
using ((select auth.uid()) = user_id);

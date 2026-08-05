create table if not exists public.lifeos_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  schema_version integer not null default 2,
  updated_at timestamptz not null default now()
);

alter table public.lifeos_snapshots enable row level security;

grant select, insert, update, delete on public.lifeos_snapshots to authenticated;
revoke all on public.lifeos_snapshots from anon;

drop policy if exists "Users can read their LifeOS snapshot" on public.lifeos_snapshots;
drop policy if exists "Users can create their LifeOS snapshot" on public.lifeos_snapshots;
drop policy if exists "Users can update their LifeOS snapshot" on public.lifeos_snapshots;
drop policy if exists "Users can delete their LifeOS snapshot" on public.lifeos_snapshots;

create policy "Users can read their LifeOS snapshot"
on public.lifeos_snapshots for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their LifeOS snapshot"
on public.lifeos_snapshots for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their LifeOS snapshot"
on public.lifeos_snapshots for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their LifeOS snapshot"
on public.lifeos_snapshots for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists lifeos_snapshots_updated_at_idx on public.lifeos_snapshots(updated_at desc);

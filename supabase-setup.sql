-- Run once in Supabase SQL Editor.
create table if not exists public.points (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  house text not null,
  participant text not null,
  "regNo" text,
  rank text not null,
  points integer not null default 0,
  date date,
  remarks text,
  "createdAt" timestamptz not null default now()
);
alter table public.points enable row level security;

drop policy if exists "Public can view points" on public.points;
drop policy if exists "Only admin can add points" on public.points;
drop policy if exists "Only admin can edit points" on public.points;
drop policy if exists "Only admin can delete points" on public.points;
drop policy if exists "Authenticated users can insert points" on public.points;
drop policy if exists "Authenticated users can update points" on public.points;
drop policy if exists "Authenticated users can delete points" on public.points;

create policy "Public can view points" on public.points
for select to anon, authenticated using (true);

-- Replace the UUID below with your admin user's UID from Authentication > Users.
create policy "Only admin can add points" on public.points
for insert to authenticated
with check (auth.uid() = 'cccdbda0-c1dd-4c2b-9ef4-e3756ddd072a');

create policy "Only admin can edit points" on public.points
for update to authenticated
using (auth.uid() = 'cccdbda0-c1dd-4c2b-9ef4-e3756ddd072a')
with check (auth.uid() = 'cccdbda0-c1dd-4c2b-9ef4-e3756ddd072a');

create policy "Only admin can delete points" on public.points
for delete to authenticated
using (auth.uid() = 'cccdbda0-c1dd-4c2b-9ef4-e3756ddd072a');

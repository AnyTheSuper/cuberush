-- Run in Supabase SQL Editor (after schema.sql) for live race matchmaking.

create table if not exists public.race_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text,
  rating int not null default 1200,
  event text not null,
  created_at timestamptz not null default now()
);

create index if not exists race_queue_event_created on public.race_queue (event, created_at);

create table if not exists public.race_matches (
  id uuid primary key,
  event text not null,
  scramble text not null,
  player_a uuid not null references auth.users (id) on delete cascade,
  player_b uuid not null references auth.users (id) on delete cascade,
  status text not null default 'ready',
  created_at timestamptz not null default now()
);

alter table public.race_queue enable row level security;
alter table public.race_matches enable row level security;

drop policy if exists "race_queue_own" on public.race_queue;
create policy "race_queue_own"
  on public.race_queue
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "race_queue_read_match" on public.race_queue;
create policy "race_queue_read_match"
  on public.race_queue
  for select
  using (true);

drop policy if exists "race_matches_players" on public.race_matches;
create policy "race_matches_players"
  on public.race_matches
  for all
  using (auth.uid() = player_a or auth.uid() = player_b)
  with check (auth.uid() = player_a or auth.uid() = player_b);

-- Memory Palace — Supabase schema, Row-Level Security and Storage policies.
-- Run this in the Supabase SQL editor for your project. The palace itself lives
-- in code; this database only ever holds per-user content and progress.
-- Every table is isolated with RLS so no user can read another's data.

-- ---------------------------------------------------------------------------
-- profiles (mirror of auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- content_sets
-- ---------------------------------------------------------------------------
create table if not exists public.content_sets (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('study', 'list', 'verbatim', 'numbers', 'custom')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists content_sets_user_idx on public.content_sets (user_id);

-- ---------------------------------------------------------------------------
-- items
-- ---------------------------------------------------------------------------
create table if not exists public.items (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  content_set_id uuid not null references public.content_sets (id) on delete cascade,
  locus_index int not null check (locus_index between 1 and 52),
  content text not null,
  content_type text not null check (content_type in ('fact','list-item','concept','number','image-ref')),
  association text,
  image_path text,
  embedding jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_set_id, locus_index)
);
create index if not exists items_user_idx on public.items (user_id);

-- ---------------------------------------------------------------------------
-- reviews (SM-2 state, one per item)
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  repetitions int not null default 0,
  interval_days int not null default 0,
  ease_factor real not null default 2.5,
  scheduled_for timestamptz not null default now(),
  last_reviewed timestamptz,
  last_score int,
  updated_at timestamptz not null default now(),
  unique (item_id)
);
create index if not exists reviews_user_idx on public.reviews (user_id);

-- ---------------------------------------------------------------------------
-- card_results
-- ---------------------------------------------------------------------------
create table if not exists public.card_results (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  deck_seed bigint not null,
  deck_order jsonb not null,
  recalled jsonb not null,
  score int not null,
  time_ms int not null,
  created_at timestamptz not null default now()
);
create index if not exists card_results_user_idx on public.card_results (user_id);

-- ---------------------------------------------------------------------------
-- Row-Level Security: user_id = auth.uid() on every table.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.content_sets enable row level security;
alter table public.items enable row level security;
alter table public.reviews enable row level security;
alter table public.card_results enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "own content_sets" on public.content_sets;
create policy "own content_sets" on public.content_sets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own items" on public.items;
create policy "own items" on public.items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own reviews" on public.reviews;
create policy "own reviews" on public.reviews
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own card_results" on public.card_results;
create policy "own card_results" on public.card_results
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage bucket for per-item images, owner-scoped.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', false)
on conflict (id) do nothing;

drop policy if exists "own images read" on storage.objects;
create policy "own images read" on storage.objects
  for select using (bucket_id = 'item-images' and owner = auth.uid());

drop policy if exists "own images write" on storage.objects;
create policy "own images write" on storage.objects
  for insert with check (bucket_id = 'item-images' and owner = auth.uid());

drop policy if exists "own images delete" on storage.objects;
create policy "own images delete" on storage.objects
  for delete using (bucket_id = 'item-images' and owner = auth.uid());

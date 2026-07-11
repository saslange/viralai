-- ViralAI: Instagram content & hook analysis tool
-- Single-tenant app (one user: sash@heysash.de), so RLS just requires an authenticated session.

create table if not exists tracked_accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  display_name text,
  avatar_url text,
  notes text,
  is_active boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references tracked_accounts(id) on delete cascade,
  ig_post_id text not null,
  permalink text,
  media_type text not null default 'image' check (media_type in ('image', 'video', 'carousel')),
  media_url text,
  thumbnail_url text,
  caption text,
  hook text,
  like_count integer,
  comment_count integer,
  view_count integer,
  posted_at timestamptz,
  fetched_at timestamptz not null default now(),
  hook_category text,
  unique (account_id, ig_post_id)
);

create index if not exists posts_account_idx on posts(account_id);
create index if not exists posts_posted_at_idx on posts(posted_at desc);

create table if not exists swipes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade unique,
  decision text not null check (decision in ('keep', 'leave', 'save')),
  swiped_at timestamptz not null default now()
);

alter table tracked_accounts enable row level security;
alter table posts enable row level security;
alter table swipes enable row level security;

create policy "authenticated full access" on tracked_accounts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated full access" on posts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated full access" on swipes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

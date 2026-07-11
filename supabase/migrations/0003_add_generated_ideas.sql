create table if not exists generated_ideas (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  hook text not null,
  reasoning text,
  theme text,
  created_at timestamp default now(),
  user_id uuid references auth.users(id) on delete cascade
);

alter table generated_ideas enable row level security;

create policy "Users can view their own generated ideas"
  on generated_ideas for select
  using (auth.uid() = user_id);

create policy "Users can insert their own generated ideas"
  on generated_ideas for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own generated ideas"
  on generated_ideas for delete
  using (auth.uid() = user_id);

create index idx_generated_ideas_user_id on generated_ideas(user_id);
create index idx_generated_ideas_created_at on generated_ideas(created_at desc);

alter table posts add column if not exists label text;

create index idx_posts_label on posts(label);

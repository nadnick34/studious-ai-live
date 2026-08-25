create table if not exists assignments (
  id text primary key,
  user_id text not null,
  class_id text not null,
  title text not null,
  created_at timestamptz not null default now(),
  instructions_text text not null default '',
  source_files jsonb not null default '[]'::jsonb,
  guidance jsonb,
  submissions jsonb not null default '[]'::jsonb
);
create index if not exists assignments_user_class_idx on assignments (user_id, class_id);

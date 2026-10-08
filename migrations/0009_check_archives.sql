alter table assignments add column if not exists archived boolean not null default false;

create table if not exists paper_checks (
  id text primary key,
  user_id text not null,
  title text not null default '',
  mode text not null,
  band text,
  sections jsonb not null default '[]'::jsonb,
  source_text text not null default '',
  created_at timestamptz not null default now(),
  archived boolean not null default false
);
create index if not exists paper_checks_user_idx on paper_checks (user_id, archived);

-- Columns and tables the app already reads that no earlier migration created.
-- Additive and idempotent. App tables only.

alter table study_sets add column if not exists archived boolean not null default false;

alter table teacher_assessments add column if not exists archived boolean not null default false;
alter table teacher_assessments add column if not exists questions jsonb not null default '[]'::jsonb;

alter table profiles add column if not exists education_approach text;
alter table profiles add column if not exists state text;
alter table profiles add column if not exists education_level text;
alter table profiles add column if not exists college_class text;
alter table profiles add column if not exists student_grade text;

create table if not exists teacher_tool_state (
  user_id text primary key,
  scriptorium_log jsonb not null default '[]'::jsonb,
  testprep_cards jsonb not null default '{}'::jsonb,
  student_testprep jsonb not null default '[]'::jsonb,
  college_compare jsonb,
  teacher_prep_tracks jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table teacher_tool_state add column if not exists scriptorium_log jsonb not null default '[]'::jsonb;
alter table teacher_tool_state add column if not exists testprep_cards jsonb not null default '{}'::jsonb;
alter table teacher_tool_state add column if not exists student_testprep jsonb not null default '[]'::jsonb;
alter table teacher_tool_state add column if not exists college_compare jsonb;
alter table teacher_tool_state add column if not exists teacher_prep_tracks jsonb not null default '[]'::jsonb;
alter table teacher_tool_state add column if not exists updated_at timestamptz not null default now();

create table if not exists activity_log (
  id text primary key,
  user_id text,
  email text,
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);

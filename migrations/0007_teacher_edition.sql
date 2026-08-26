create table if not exists teacher_classes (
  id text primary key,
  user_id text not null,
  name text not null,
  subject text not null default '',
  grade_level text not null default '',
  course_level text not null default 'Regular',
  school_type text not null default 'Private Independent',
  school_name text not null default '',
  created_at timestamptz not null default now(),
  archived boolean not null default false
);
create index if not exists teacher_classes_user_idx on teacher_classes (user_id);

create table if not exists teacher_students (
  id text primary key,
  user_id text not null,
  class_id text not null,
  name text not null,
  average double precision not null default 0
);
create index if not exists teacher_students_class_idx on teacher_students (user_id, class_id);

create table if not exists teacher_assessments (
  id text primary key,
  user_id text not null,
  class_id text not null,
  name text not null,
  type text not null default 'Quiz',
  topics text not null default '',
  points_possible integer not null default 100,
  created_at timestamptz not null default now(),
  source_files jsonb not null default '[]'::jsonb,
  class_average double precision not null default 0,
  topic_scores jsonb not null default '[]'::jsonb,
  strengths jsonb not null default '[]'::jsonb,
  needs jsonb not null default '[]'::jsonb,
  results jsonb not null default '[]'::jsonb
);
create index if not exists teacher_assessments_class_idx on teacher_assessments (user_id, class_id);

alter table profiles add column if not exists school_type text;
alter table profiles add column if not exists grade_level text;
alter table profiles add column if not exists course_level text;
alter table profiles add column if not exists teacher_subject text;

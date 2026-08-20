create table if not exists profiles (
  user_id text primary key,
  display_name text,
  phone text not null default '',
  sms_alerts boolean not null default false,
  school_select text not null default 'studious',
  palette_id text,
  custom_school_name text,
  school_logo_url text,
  avatar_data_url text,
  role text not null default 'student',
  edition text not null default 'student',
  setup_complete boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists classes (
  id text primary key,
  user_id text not null,
  name text not null,
  code text not null default '',
  subject text not null default '',
  created_at timestamptz not null default now(),
  last_accessed timestamptz not null default now(),
  archived boolean not null default false,
  school_name text,
  semester text,
  professor_name text,
  professor_insight text,
  textbook text,
  textbook_author text,
  schedule_days text,
  schedule_time text,
  syllabus_file text,
  syllabus_text text,
  misc_notes text,
  alerts jsonb not null default '[]'::jsonb,
  upcoming jsonb not null default '[]'::jsonb
);
create index if not exists classes_user_id_idx on classes (user_id);

create table if not exists study_sets (
  id text primary key,
  user_id text not null,
  class_id text not null,
  name text not null,
  created_at timestamptz not null default now(),
  notes jsonb not null,
  audio_script text not null default '',
  quiz jsonb not null default '[]'::jsonb,
  flashcards jsonb not null default '[]'::jsonb,
  source_files jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  focus_prompt text
);
create index if not exists study_sets_user_class_idx on study_sets (user_id, class_id);

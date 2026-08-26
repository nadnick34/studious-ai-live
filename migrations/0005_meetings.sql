create table if not exists meetings (
  id text primary key,
  user_id text not null,
  name text not null,
  category text not null default 'Regular Work',
  organizer text not null default '',
  meeting_type text not null default 'In-Person',
  subject text not null default '',
  company_name text not null default '',
  location text not null default '',
  meeting_at timestamptz,
  attendees text not null default '',
  misc_notes text not null default '',
  agenda_text text not null default '',
  invite_text text not null default '',
  created_at timestamptz not null default now(),
  last_accessed timestamptz not null default now(),
  archived boolean not null default false,
  project_id text
);
create index if not exists meetings_user_idx on meetings (user_id);

create table if not exists meeting_sessions (
  id text primary key,
  user_id text not null,
  meeting_id text not null,
  name text not null,
  created_at timestamptz not null default now(),
  notes jsonb not null default '{}'::jsonb,
  focus_items jsonb not null default '[]'::jsonb,
  action_items jsonb not null default '[]'::jsonb,
  audio_script text not null default '',
  source_files jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb
);
create index if not exists meeting_sessions_meeting_idx on meeting_sessions (user_id, meeting_id);

create table if not exists meeting_projects (
  id text primary key,
  user_id text not null,
  name text not null,
  meeting_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  archived boolean not null default false
);
create index if not exists meeting_projects_user_idx on meeting_projects (user_id);

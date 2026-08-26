alter table meeting_projects add column if not exists description text not null default '';
alter table meeting_projects add column if not exists status text not null default 'active';
alter table meeting_projects add column if not exists stakeholders jsonb not null default '[]'::jsonb;
alter table meeting_projects add column if not exists plan jsonb not null default '{}'::jsonb;
alter table meeting_projects add column if not exists gantt_tasks jsonb not null default '[]'::jsonb;
alter table meeting_projects add column if not exists materials jsonb not null default '[]'::jsonb;
alter table meeting_projects add column if not exists status_summary text not null default '';
alter table meeting_projects add column if not exists start_date date;
alter table meeting_projects add column if not exists end_date date;

alter table study_sets add column if not exists slides jsonb not null default '[]'::jsonb;

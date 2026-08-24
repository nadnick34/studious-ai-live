alter table profiles add column if not exists for_child boolean not null default false;
alter table profiles add column if not exists child_age integer;
alter table profiles add column if not exists child_gender text;
alter table profiles add column if not exists kids_mode boolean not null default false;

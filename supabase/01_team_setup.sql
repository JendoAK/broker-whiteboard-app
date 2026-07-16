-- FoodBrokerBase Supabase setup
-- Run this in Supabase SQL Editor after the project is created.
-- It creates user profiles, admin/member roles, and a flexible app_records table
-- that we can use to migrate the current local app data into shared cloud records.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_records (
  id uuid primary key default gen_random_uuid(),
  record_type text not null,
  record_key text not null,
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, record_type, record_key)
);

create index if not exists app_records_type_idx on public.app_records (record_type);
create index if not exists app_records_owner_idx on public.app_records (owner_id);
create index if not exists app_records_updated_idx on public.app_records (updated_at desc);
create index if not exists app_records_data_gin_idx on public.app_records using gin (data);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_app_records_updated_at on public.app_records;
create trigger set_app_records_updated_at
before update on public.app_records
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.app_records enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1 from public.profiles admin_profile
    where admin_profile.id = auth.uid()
      and admin_profile.role = 'admin'
  )
);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1 from public.profiles admin_profile
    where admin_profile.id = auth.uid()
      and admin_profile.role = 'admin'
  )
)
with check (
  id = auth.uid()
  or exists (
    select 1 from public.profiles admin_profile
    where admin_profile.id = auth.uid()
      and admin_profile.role = 'admin'
  )
);

drop policy if exists "app_records_select_own_or_admin" on public.app_records;
create policy "app_records_select_own_or_admin"
on public.app_records for select
to authenticated
using (
  owner_id = auth.uid()
  or created_by = auth.uid()
  or exists (
    select 1 from public.profiles admin_profile
    where admin_profile.id = auth.uid()
      and admin_profile.role = 'admin'
  )
);

drop policy if exists "app_records_insert_own" on public.app_records;
create policy "app_records_insert_own"
on public.app_records for insert
to authenticated
with check (
  owner_id = auth.uid()
  and created_by = auth.uid()
);

drop policy if exists "app_records_update_own_or_admin" on public.app_records;
create policy "app_records_update_own_or_admin"
on public.app_records for update
to authenticated
using (
  owner_id = auth.uid()
  or created_by = auth.uid()
  or exists (
    select 1 from public.profiles admin_profile
    where admin_profile.id = auth.uid()
      and admin_profile.role = 'admin'
  )
)
with check (
  owner_id = auth.uid()
  or exists (
    select 1 from public.profiles admin_profile
    where admin_profile.id = auth.uid()
      and admin_profile.role = 'admin'
  )
);

drop policy if exists "app_records_delete_own_or_admin" on public.app_records;
create policy "app_records_delete_own_or_admin"
on public.app_records for delete
to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.profiles admin_profile
    where admin_profile.id = auth.uid()
      and admin_profile.role = 'admin'
  )
);

-- After your own account is created in the app, run this once with your email:
-- update public.profiles set role = 'admin' where email = 'your-email@company.com';

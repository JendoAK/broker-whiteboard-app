-- FoodBrokerBase shared team sections
-- Run this after 01_team_setup.sql.
-- It separates personal user data from company/team data.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles alter column role set default 'pending';
alter table public.profiles
  add constraint profiles_role_check check (role in ('pending', 'member', 'admin'));

update public.profiles
set role = 'admin'
where lower(email) = 'jennyd@piercecartwright.com';

create or replace function public.can_use_app()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('member', 'admin')
  );
$$;

revoke all on function public.can_use_app() from public;
grant execute on function public.can_use_app() to authenticated;

create table if not exists public.team_app_records (
  id uuid primary key default gen_random_uuid(),
  record_type text not null default 'team_section',
  record_key text not null,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (record_type, record_key)
);

create index if not exists team_app_records_type_idx on public.team_app_records (record_type);
create index if not exists team_app_records_updated_idx on public.team_app_records (updated_at desc);
create index if not exists team_app_records_data_gin_idx on public.team_app_records using gin (data);

drop trigger if exists set_team_app_records_updated_at on public.team_app_records;
create trigger set_team_app_records_updated_at
before update on public.team_app_records
for each row execute function public.set_updated_at();

alter table public.team_app_records enable row level security;

drop policy if exists "team_app_records_select_members" on public.team_app_records;
create policy "team_app_records_select_members"
on public.team_app_records for select
to authenticated
using (public.can_use_app());

drop policy if exists "team_app_records_insert_members" on public.team_app_records;
create policy "team_app_records_insert_members"
on public.team_app_records for insert
to authenticated
with check (public.can_use_app());

drop policy if exists "team_app_records_update_members" on public.team_app_records;
create policy "team_app_records_update_members"
on public.team_app_records for update
to authenticated
using (public.can_use_app())
with check (public.can_use_app());

drop policy if exists "team_app_records_delete_admin" on public.team_app_records;
create policy "team_app_records_delete_admin"
on public.team_app_records for delete
to authenticated
using (public.is_admin());

drop policy if exists "app_records_select_own_or_admin" on public.app_records;
create policy "app_records_select_own_or_admin"
on public.app_records for select
to authenticated
using (
  public.can_use_app()
  and (
    owner_id = auth.uid()
    or created_by = auth.uid()
    or public.is_admin()
  )
);

drop policy if exists "app_records_insert_own" on public.app_records;
create policy "app_records_insert_own"
on public.app_records for insert
to authenticated
with check (
  public.can_use_app()
  and owner_id = auth.uid()
  and created_by = auth.uid()
);

drop policy if exists "app_records_update_own_or_admin" on public.app_records;
create policy "app_records_update_own_or_admin"
on public.app_records for update
to authenticated
using (
  public.can_use_app()
  and (
    owner_id = auth.uid()
    or created_by = auth.uid()
    or public.is_admin()
  )
)
with check (
  public.can_use_app()
  and (
    owner_id = auth.uid()
    or public.is_admin()
  )
);

drop policy if exists "app_records_delete_own_or_admin" on public.app_records;
create policy "app_records_delete_own_or_admin"
on public.app_records for delete
to authenticated
using (
  public.can_use_app()
  and (
    owner_id = auth.uid()
    or public.is_admin()
  )
);

-- To approve a coworker after they create an account, run:
-- update public.profiles set role = 'member' where lower(email) = 'coworker@piercecartwright.com';

-- To make your boss able to manage everyone later, run:
-- update public.profiles set role = 'admin' where lower(email) = 'boss@piercecartwright.com';

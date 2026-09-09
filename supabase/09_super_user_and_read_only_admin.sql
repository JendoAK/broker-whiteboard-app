-- Apply after migrations 01-07, before publishing the matching app release.
-- Includes the team initials functions from migration 08 with restricted writes.
begin;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('pending','member','admin','super_user'));

create or replace function public.is_super_user() returns boolean language sql stable security definer set search_path = public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='super_user');
$$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','super_user'));
$$;
create or replace function public.can_use_app() returns boolean language sql stable security definer set search_path = public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role in ('member','admin','super_user'));
$$;
revoke all on function public.is_super_user() from public;
grant execute on function public.is_super_user() to authenticated;

create or replace function public.enforce_company_email_for_approved_role() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if new.role in ('member','admin','super_user') and lower(split_part(coalesce(new.email,''),'@',2)) <> 'piercecartwright.com' then
  raise exception 'Only company users can receive team access.';
 end if;
 return new;
end; $$;

-- Promote only the account explicitly identified by the owner. Fail closed if missing.
do $$ begin
 update public.profiles set role='super_user' where lower(email)='jennyd@piercecartwright.com';
 if not found then raise exception 'Jenny company profile not found; no changes applied.'; end if;
end $$;

-- Replace all previous permissive write policies, including legacy policy names.
do $$ declare p record; begin
 for p in select policyname, tablename from pg_policies where schemaname='public'
  and tablename in ('profiles','app_records') and cmd in ('ALL','INSERT','UPDATE','DELETE') loop
  execute format('drop policy %I on public.%I',p.policyname,p.tablename);
 end loop;
end $$;
create policy profiles_super_update on public.profiles for update to authenticated using(public.is_super_user()) with check(public.is_super_user());
create policy personal_insert on public.app_records for insert to authenticated with check(public.can_use_app() and (owner_id=auth.uid() or public.is_super_user()));
create policy personal_update on public.app_records for update to authenticated using(public.can_use_app() and (owner_id=auth.uid() or public.is_super_user())) with check(public.can_use_app() and (owner_id=auth.uid() or public.is_super_user()));
create policy personal_delete on public.app_records for delete to authenticated using(public.can_use_app() and (owner_id=auth.uid() or public.is_super_user()));
drop policy if exists team_app_records_delete_admin on public.team_app_records;
create policy team_app_records_delete_super on public.team_app_records for delete to authenticated using(public.is_super_user());
-- Existing team insert/update policies continue to use can_use_app(): all members
-- can schedule calls/appointments in shared vendor visits.

create or replace function public.set_team_user_role(target_user uuid,new_role text) returns void language plpgsql security definer set search_path=public as $$
declare old_role text;
begin
 if not public.is_admin() then raise exception 'Administrator access required.'; end if;
 if new_role is null or new_role not in ('pending','member','admin','super_user') then raise exception 'Invalid role.'; end if;
 select role into old_role from public.profiles where id=target_user for update;
 if not found then raise exception 'User profile not found.'; end if;
 if not public.is_super_user() and not (old_role='pending' and new_role='member') then raise exception 'Administrators can only approve pending members.'; end if;
 if target_user=auth.uid() and old_role='super_user' and new_role<>'super_user' then raise exception 'You cannot remove your own super user access.'; end if;
 update public.profiles set role=new_role where id=target_user;
end; $$;

create or replace function public.delete_team_user(target_user uuid) returns void language plpgsql security definer set search_path=public,auth as $$
begin
 if not public.is_super_user() then raise exception 'Super user access required.'; end if;
 if target_user=auth.uid() then raise exception 'You cannot delete your own account.'; end if;
 delete from auth.users where id=target_user;
 if not found then raise exception 'User not found.'; end if;
end; $$;

create or replace function public.set_team_user_initials(target_user uuid,new_initials text) returns void language plpgsql security definer set search_path=public,auth as $$
declare normalized text := upper(trim(coalesce(new_initials,'')));
begin
 if not public.is_super_user() then raise exception 'Super user access required.'; end if;
 if normalized !~ '^[A-Z]{1,4}$' then raise exception 'Enter 1-4 letters.'; end if;
 update auth.users set raw_user_meta_data=coalesce(raw_user_meta_data,'{}'::jsonb)||jsonb_build_object('initials',normalized),updated_at=now()
 where id=target_user and exists(select 1 from public.profiles where id=target_user);
 if not found then raise exception 'Team member not found.'; end if;
end; $$;
create or replace function public.get_team_initials() returns table(user_id uuid,initials text) language sql security definer set search_path=public,auth as $$
 select u.id,coalesce(u.raw_user_meta_data->>'initials','') from auth.users u join public.profiles p on p.id=u.id where public.is_super_user();
$$;
revoke all on function public.get_team_initials() from public;
revoke all on function public.set_team_user_initials(uuid,text) from public;
grant execute on function public.get_team_initials() to authenticated;
grant execute on function public.set_team_user_initials(uuid,text) to authenticated;

create or replace function public.get_team_member_work(target_user uuid)
returns table(record_key text,data jsonb) language plpgsql security definer set search_path=public as $$
begin
 if not public.is_admin() then raise exception 'Administrator access required.'; end if;
 return query select r.record_key,r.data from public.app_records r where r.owner_id=target_user and r.record_type='app_section'
 and r.record_key in ('broker-whiteboard-cards','broker-whiteboard-todos','broker-whiteboard-manual-vendor-reports','broker-whiteboard-market-visits-personal','broker-whiteboard-market-visits-pc');
end; $$;
revoke all on function public.get_team_member_work(uuid) from public;
grant execute on function public.get_team_member_work(uuid) to authenticated;
notify pgrst,'reload schema';
commit;

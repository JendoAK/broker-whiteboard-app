begin;

alter table public.profiles
  alter column role set default 'pending';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('pending', 'member', 'admin'));

update public.profiles
set role = 'admin'
where lower(email) = 'jennyd@piercecartwright.com';

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
drop policy if exists "profiles_admin_update" on public.profiles;

create policy "profiles_admin_update"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.get_team_profiles()
returns table (
  user_id uuid,
  email text,
  display_name text,
  role text,
  created_at timestamptz
)
language sql
security definer
set search_path = public, auth
as $$
  select p.id, u.email::text, p.display_name, p.role, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_admin()
  order by lower(coalesce(p.display_name, u.email));
$$;

create or replace function public.set_team_user_role(target_user uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an administrator can change team access.';
  end if;

  if new_role not in ('pending', 'member', 'admin') then
    raise exception 'Invalid role.';
  end if;

  if target_user = auth.uid() and new_role <> 'admin' then
    raise exception 'An administrator cannot remove their own admin access.';
  end if;

  update public.profiles
  set role = new_role
  where id = target_user;

  if not found then
    raise exception 'User profile not found.';
  end if;
end;
$$;

revoke all on function public.get_team_profiles() from public;
revoke all on function public.set_team_user_role(uuid, text) from public;
grant execute on function public.get_team_profiles() to authenticated;
grant execute on function public.set_team_user_role(uuid, text) to authenticated;

notify pgrst, 'reload schema';

commit;

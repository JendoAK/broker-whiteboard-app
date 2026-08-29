-- FoodBrokerBase administrator account deletion
-- Run this file once in the Supabase SQL Editor.

begin;

create or replace function public.delete_team_user(target_user uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_role text;
  admin_count integer;
begin
  if not public.is_admin() then
    raise exception 'Only an administrator can delete team accounts.';
  end if;

  if target_user is null then
    raise exception 'A user account is required.';
  end if;

  if target_user = auth.uid() then
    raise exception 'You cannot delete your own administrator account.';
  end if;

  select role
  into target_role
  from public.profiles
  where id = target_user;

  if target_role is null then
    raise exception 'User profile not found.';
  end if;

  if target_role = 'admin' then
    select count(*)
    into admin_count
    from public.profiles
    where role = 'admin';

    if admin_count <= 1 then
      raise exception 'The final administrator cannot be deleted.';
    end if;
  end if;

  delete from auth.users
  where id = target_user;

  if not found then
    raise exception 'User account not found.';
  end if;
end;
$$;

revoke all on function public.delete_team_user(uuid) from public;
grant execute on function public.delete_team_user(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;

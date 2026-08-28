begin;

-- Supabase Auth calls this function before creating a new user. The hook must
-- also be enabled in Authentication > Hooks after this script is run.
create or replace function public.hook_restrict_signup_to_pierce_cartwright(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  signup_email text := lower(coalesce(event -> 'user' ->> 'email', ''));
begin
  if split_part(signup_email, '@', 2) = 'piercecartwright.com' then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'message', 'Only @piercecartwright.com email addresses can create an account.',
      'http_code', 403
    )
  );
end;
$$;

grant execute on function public.hook_restrict_signup_to_pierce_cartwright(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_restrict_signup_to_pierce_cartwright(jsonb) from authenticated, anon, public;

-- An approved role can never be assigned to a non-company address, even if an
-- administrator tries to update the profile outside the app.
create or replace function public.enforce_company_email_for_approved_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role in ('member', 'admin')
     and lower(split_part(coalesce(new.email, ''), '@', 2)) <> 'piercecartwright.com' then
    raise exception 'Only @piercecartwright.com users can receive team access.';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_company_email_role_guard on public.profiles;
create trigger profiles_company_email_role_guard
before insert or update of email, role on public.profiles
for each row execute function public.enforce_company_email_for_approved_role();

-- If an outside account already exists, leave the account intact but revoke
-- app access by returning its profile to Pending.
update public.profiles
set role = 'pending'
where role in ('member', 'admin')
  and lower(split_part(coalesce(email, ''), '@', 2)) <> 'piercecartwright.com';

create or replace function public.set_team_user_role(target_user uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_email text;
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

  select lower(coalesce(email, ''))
  into target_email
  from public.profiles
  where id = target_user;

  if not found then
    raise exception 'User profile not found.';
  end if;

  if new_role in ('member', 'admin')
     and split_part(target_email, '@', 2) <> 'piercecartwright.com' then
    raise exception 'Only @piercecartwright.com users can receive team access.';
  end if;

  update public.profiles
  set role = new_role
  where id = target_user;
end;
$$;

revoke all on function public.set_team_user_role(uuid, text) from public;
grant execute on function public.set_team_user_role(uuid, text) to authenticated;

notify pgrst, 'reload schema';

commit;

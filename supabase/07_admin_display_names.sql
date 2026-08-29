begin;

create or replace function public.set_team_user_display_name(
  target_user uuid,
  new_display_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an administrator can change display names.';
  end if;

  update public.profiles
  set display_name = nullif(trim(coalesce(new_display_name, '')), '')
  where id = target_user;

  if not found then
    raise exception 'User profile not found.';
  end if;
end;
$$;

revoke all on function public.set_team_user_display_name(uuid, text) from public;
grant execute on function public.set_team_user_display_name(uuid, text) to authenticated;

notify pgrst, 'reload schema';
commit;

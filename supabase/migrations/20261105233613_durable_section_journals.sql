-- An older open app can normalize away fields it does not recognize (My Day,
-- due time, or newly added calendar entries). Require a supported write format
-- and an exact base version for raw browser writes to collection records.
-- Existing role-checked RPCs run as their owner and enforce their own versions.
create or replace function public.guard_collection_write_versions()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  expected_version timestamptz;
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if new.record_type not in ('app_section', 'team_section') then
    return new;
  end if;
  if tg_table_name = 'team_app_records' and new.record_key in (
    'broker-whiteboard-people-contacts', 'broker-whiteboard-address-book',
    'broker-whiteboard-sample-tracker', 'broker-whiteboard-dot-orders'
  ) then
    return new;
  end if;
  if new.data->>'syncProtocol' is distinct from '3' then
    raise sqlstate 'PT426' using
      message = 'This copy of FoodBrokerBase needs an update. Your changes are kept on this device. Save any open form, then refresh the app to finish syncing.',
      hint = 'Older app copies cannot replace current cloud data.';
  end if;
  if tg_op = 'UPDATE' then
    begin
      expected_version := (new.data->>'syncWriteBase')::timestamptz;
    exception when invalid_datetime_format or datetime_field_overflow or invalid_text_representation then
      raise sqlstate 'PT409' using message = 'The cloud version changed. Keep the browser changes and retry against the latest version.';
    end;
    if expected_version is distinct from old.updated_at then
      raise sqlstate 'PT409' using message = 'The cloud version changed. Keep the browser changes and retry against the latest version.';
    end if;
  end if;
  return new;
end;
$$;


-- Keep the existing approval, allowed-section, and exact-revision checks.
-- Clients that infer edits from a stale whole-browser cache must update.
create or replace function public.save_team_directory_section(section_key text, section_value jsonb, expected_updated_at text default null)
returns jsonb language plpgsql security definer set search_path = '' as $function$
begin
  if auth.uid() is null or not public.can_use_app() then
    raise exception 'Approved team access required.' using errcode='42501';
  end if;
  if section_key is null or section_key not in ('broker-whiteboard-people-contacts','broker-whiteboard-address-book') then
    raise exception 'This RPC only saves the shared contacts and operators directories.' using errcode='42501';
  end if;
  if section_value->>'syncProtocol' is distinct from '3' then
    raise sqlstate 'PT426' using message = 'This copy of FoodBrokerBase needs an update. Save any open form, then refresh the app to finish syncing. Your browser copy has been kept.';
  end if;
  return private.save_team_directory_section_value($1,$2,$3);
end;
$function$;

-- Exercise the real trigger under the browser's database role using temporary
-- tables only. No production records are created or modified by these checks.
create temporary table app_records (
  id text primary key, record_type text, record_key text, data jsonb,
  updated_at timestamptz default '2026-01-01T00:00:00Z'
) on commit drop;
create temporary table team_app_records (like pg_temp.app_records including all) on commit drop;

insert into pg_temp.app_records (id,record_type,record_key,data) values
  ('personal','app_section','broker-whiteboard-todos',
   '{"value":[{"id":"task","title":"Existing task","myDay":"2026-11-05"}]}'::jsonb);
insert into pg_temp.team_app_records (id,record_type,record_key,data) values
  ('shared','team_section','broker-whiteboard-market-visits-vendor',
   '{"value":[{"id":"visit","calls":[{"id":"call","title":"Existing call"}]}]}'::jsonb);

create trigger guard_collection_write_versions before insert or update on pg_temp.app_records
for each row execute function public.guard_collection_write_versions();
create trigger guard_collection_write_versions before insert or update on pg_temp.team_app_records
for each row execute function public.guard_collection_write_versions();
grant select, insert, update on pg_temp.app_records, pg_temp.team_app_records to authenticated;

set local role authenticated;
do $$
begin
  -- The old bulk upsert must not erase the current My Day selection.
  begin
    insert into pg_temp.app_records(id,record_type,record_key,data)
    values ('personal','app_section','broker-whiteboard-todos','{"value":[{"id":"task","title":"Existing task"}]}')
    on conflict(id) do update set data=excluded.data;
    raise exception 'Old-format upsert was incorrectly accepted';
  exception when sqlstate 'PT426' then null;
  end;
  if (select data#>>'{value,0,myDay}' from pg_temp.app_records where id='personal') <> '2026-11-05' then
    raise exception 'Old-format upsert changed My Day';
  end if;

  -- Previous versioned clients can still replay stale browser cache fields.
  begin
    update pg_temp.app_records set data=jsonb_build_object('syncProtocol',2,'syncWriteBase',updated_at::text,'value','[]'::jsonb) where id='personal';
    raise exception 'Previous-format save was incorrectly accepted';
  exception when sqlstate 'PT426' then null;
  end;

  -- Even a current format cannot replace a revision it has not read.
  begin
    update pg_temp.app_records set data='{"syncProtocol":3,"syncWriteBase":"2025-01-01T00:00:00Z","value":[]}'
    where id='personal';
    raise exception 'Stale current-format save was incorrectly accepted';
  exception when sqlstate 'PT409' then null;
  end;

  -- A correctly versioned save can add a task while preserving the selection.
  update pg_temp.app_records
  set data=jsonb_build_object('syncProtocol',3,'syncWriteBase',updated_at::text,
    'value','[{"id":"task","title":"Existing task","myDay":"2026-11-05"},{"id":"new","title":"New task","myDay":"2026-11-05"}]'::jsonb),
    updated_at=updated_at+interval '1 second'
  where id='personal';
  if (select jsonb_array_length(data->'value') from pg_temp.app_records where id='personal') <> 2 then
    raise exception 'Valid current-format save did not retain both tasks';
  end if;

  -- Replaying its previous metadata is also stale after that save finishes.
  begin
    update pg_temp.app_records set data=data||'{"value":[]}'::jsonb where id='personal';
    raise exception 'Replayed write version was incorrectly accepted';
  exception when sqlstate 'PT409' then null;
  end;

  -- Removing a My Day selection intentionally is supported with a fresh base.
  update pg_temp.app_records
  set data=jsonb_build_object('syncProtocol',3,'syncWriteBase',updated_at::text,
    'value',jsonb_set(data->'value','{0,myDay}','""'::jsonb)),
    updated_at=updated_at+interval '1 second'
  where id='personal';
  if (select data#>>'{value,0,myDay}' from pg_temp.app_records where id='personal') <> '' then
    raise exception 'Intentional My Day removal was blocked';
  end if;

  -- New app collections work on a first insert as well.
  insert into pg_temp.app_records(id,record_type,record_key,data)
  values ('first','app_section','broker-whiteboard-cards','{"syncProtocol":3,"syncWriteBase":null,"value":[]}');

  -- Shared calendar lists receive the same protection.
  begin
    update pg_temp.team_app_records set data='{"value":[]}' where id='shared';
    raise exception 'Old-format shared calendar save was incorrectly accepted';
  exception when sqlstate 'PT426' then null;
  end;
  update pg_temp.team_app_records
  set data=jsonb_build_object('syncProtocol',3,'syncWriteBase',updated_at::text,'value',data->'value'),
    updated_at=updated_at+interval '1 second'
  where id='shared';

  -- Single-value workspace settings use their existing save flow.
  insert into pg_temp.app_records(id,record_type,record_key,data)
  values ('settings','workspace-preferences','distributor-workspace','{"mode":"sysco"}');
end;
$$;
reset role;

-- Trusted server-side RPC writes continue to use their existing safeguards.
update pg_temp.team_app_records set data=data-'syncProtocol'-'syncWriteBase' where id='shared';
do $$
begin
  if (select data#>>'{value,0,calls,0,id}' from pg_temp.team_app_records where id='shared') <> 'call' then
    raise exception 'Trusted server-side write lost the calendar entry';
  end if;
end;
$$;

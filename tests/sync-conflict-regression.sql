DO $test$
DECLARE
  member_id uuid; support_id uuid; section_data jsonb; section_revision text;
  before_hash text; after_hash text; saved_revision text; item_id text;
  checks jsonb := '{}'::jsonb;
BEGIN
  select id into strict member_id from public.profiles where role='member' order by id limit 1;
  select id into strict support_id from public.profiles where role='product_support' order by id limit 1;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',member_id,'role','authenticated')::text,true);
  select data,coalesce(nullif(data->>'directoryRevision',''),updated_at::text),md5(data::text)
    into strict section_data,section_revision,before_hash
    from public.team_app_records where record_type='team_section'
      and record_key='broker-whiteboard-people-contacts' for update;
  begin
    perform public.save_team_directory_section('broker-whiteboard-people-contacts',section_data,'__stale_repair_test__');
    raise exception 'Stale directory save was accepted';
  exception when sqlstate 'PT409' then checks:=checks||'{"directoryConflict":"PT409"}'::jsonb; end;
  begin
    perform public.save_team_sample_section('broker-whiteboard-sample-tracker',jsonb_build_object('value','[]'::jsonb),'__stale_repair_test__');
    raise exception 'Stale sample save was accepted';
  exception when sqlstate 'PT409' then checks:=checks||'{"sampleConflict":"PT409"}'::jsonb; end;
  begin
    saved_revision:=public.save_team_directory_section('broker-whiteboard-people-contacts',section_data,section_revision)->>'updatedAt';
    if nullif(saved_revision,'') is null or saved_revision=section_revision then raise exception 'Save did not return a new revision'; end if;
    -- Roll back this verification write even when it succeeds.
    raise exception using errcode='P0TST',message='Rollback successful save verification';
  exception when sqlstate 'P0TST' then null; end;
  select md5(data::text) into after_hash from public.team_app_records
    where record_type='team_section' and record_key='broker-whiteboard-people-contacts';
  if before_hash<>after_hash then raise exception 'Verification changed stored directory data'; end if;
  checks:=checks||jsonb_build_object('saveSuccessRolledBack',saved_revision is not null,'directoryUnchanged',before_hash=after_hash);
  begin
    perform public.get_product_support_workspace();
    raise exception 'Member received restricted Product Support access';
  exception when sqlstate '42501' then checks:=checks||'{"restrictedAccess":"42501"}'::jsonb; end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',support_id,'role','authenticated')::text,true);
  select e.value->>'id' into strict item_id from public.team_app_records s
    cross join lateral jsonb_array_elements(s.data->'value') e(value)
    where s.record_key='broker-whiteboard-people-contacts' and nullif(e.value->>'id','') is not null limit 1;
  begin
    perform public.save_product_support_contact(jsonb_build_object('id',item_id),'__stale_repair_test__');
    raise exception 'Stale Product Support contact save was accepted';
  exception when sqlstate 'PT409' then checks:=checks||'{"supportContactConflict":"PT409"}'::jsonb; end;
  select e.value->>'id' into strict item_id from public.team_app_records s
    cross join lateral jsonb_array_elements(s.data->'value') e(value)
    where s.record_key='broker-whiteboard-sample-tracker' and nullif(e.value->>'id','') is not null limit 1;
  begin
    perform public.save_product_support_sample('samples',jsonb_build_object('id',item_id),'__stale_repair_test__');
    raise exception 'Stale Product Support sample save was accepted';
  exception when sqlstate 'PT409' then checks:=checks||'{"supportSampleConflict":"PT409"}'::jsonb; end;
  select e.value->>'id' into strict item_id from public.team_app_records s
    cross join lateral jsonb_array_elements(s.data->'value') e(value)
    where s.record_key='broker-whiteboard-stock-lists' and nullif(e.value->>'id','') is not null limit 1;
  begin
    perform public.save_product_support_product('stock',jsonb_build_object('id',item_id),'__stale_repair_test__');
    raise exception 'Stale product save was accepted';
  exception when sqlstate 'PT409' then checks:=checks||'{"productConflict":"PT409"}'::jsonb; end;
  perform set_config('request.jwt.claims','{}',true);
  begin
    perform public.save_team_directory_section('broker-whiteboard-people-contacts',section_data,section_revision);
    raise exception 'Anonymous directory save was accepted';
  exception when sqlstate '42501' then checks:=checks||'{"anonymousAccess":"42501"}'::jsonb; end;
  perform set_config('foodbroker.repair_checks',checks::text,true);
END;
$test$;
select current_setting('foodbroker.repair_checks')::jsonb as checks;

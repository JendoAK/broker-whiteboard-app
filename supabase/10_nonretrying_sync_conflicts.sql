-- Return stale-edit conflicts as HTTP 409 instead of retryable serialization failures.
-- All access checks, version checks, locks and successful-write behavior are unchanged.
DO $guard$
BEGIN
  if md5(pg_get_functiondef('private.save_product_support_directory_item(text, text, jsonb, text)'::regprocedure)) <> 'a448496111f93fda27f8284186f7d802' then raise exception 'Function changed during repair: private.save_product_support_directory_item'; end if;
  if md5(pg_get_functiondef('private.save_product_support_sample_item(text, text, jsonb, text)'::regprocedure)) <> '6405baafbe2656bc1d0637a72abdd90c' then raise exception 'Function changed during repair: private.save_product_support_sample_item'; end if;
  if md5(pg_get_functiondef('private.save_team_directory_section_value(text, jsonb, text)'::regprocedure)) <> '6761f15f82c55fcc5b5dc895aec8108e' then raise exception 'Function changed during repair: private.save_team_directory_section_value'; end if;
  if md5(pg_get_functiondef('public.save_product_support_product(text, jsonb, text)'::regprocedure)) <> '59d82925fc566f19ab8868c00ee2d101' then raise exception 'Function changed during repair: public.save_product_support_product'; end if;
END;
$guard$;

CREATE OR REPLACE FUNCTION private.save_product_support_directory_item(section_key text, kind text, item jsonb, expected_updated_at text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  section public.team_app_records%rowtype; items jsonb; existing jsonb; merged jsonb;
  item_id text; item_index integer; matches integer; field text; candidate jsonb;
  people jsonb; previous_person jsonb; next_person jsonb; person_index integer;
  person_ordinal integer; person_count integer; incoming_id text;
  now_text text:=to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"');
  directory_revision text:=gen_random_uuid()::text;
  school_record boolean;
begin
  if auth.uid() is null or not public.is_product_support() then
    raise exception 'Product Support access required.' using errcode='42501';
  end if;
  if kind is null or kind not in ('contact','operator') then raise exception 'Invalid directory collection.'; end if;
  if jsonb_typeof(item) is distinct from 'object' then raise exception 'A single directory item is required.'; end if;
  if octet_length(item::text)>262144 then raise exception 'Directory details exceed the 256 KB limit.'; end if;
  if kind='contact' then perform private.product_support_directory_check_contact(item);
  else
    for field in select jsonb_object_keys(item) loop
      if field not in ('id','operation','accountNumber','syscoAccountNumber','locations','website','address','notes',
          'schoolName','location','groups','extraFields','deliveryDays','usfSalesRep','syscoSalesRep',
          'primaryContact','secondaryContact','contacts') then raise exception 'Operator field is not editable: %',field; end if;
      if field in ('primaryContact','secondaryContact') then perform private.product_support_directory_check_contact(item->field);
      elsif field='contacts' then
        if jsonb_typeof(item->field) is distinct from 'array' then raise exception 'Operator contacts must be a list.'; end if;
        if jsonb_array_length(item->field)>100 then raise exception 'Use no more than 100 operator contacts.'; end if;
        for candidate in select value from jsonb_array_elements(item->field) value loop
          perform private.product_support_directory_check_contact(candidate);
        end loop;
        if exists(select 1 from jsonb_array_elements(item->field) value
          where nullif(value->>'id','') is not null group by value->>'id' having count(*)>1) then
          raise exception 'Operator contact identifiers must not be repeated.';
        end if;
      elsif field in ('groups','extraFields','schoolName','location') then
        perform private.product_support_directory_check_contact(jsonb_build_object(field,item->field));
      elsif field in ('deliveryDays','usfSalesRep','syscoSalesRep') then
        if field<>'deliveryDays' and jsonb_typeof(item->field) in ('string','null') then
          if length(coalesce(item->>field,''))>20000 then raise exception 'Sales rep details are too long.'; end if;
        else
          if jsonb_typeof(item->field) is distinct from 'array' then raise exception 'Delivery days and sales reps must be text lists.'; end if;
          if jsonb_array_length(item->field)>100 or exists(select 1 from jsonb_array_elements(item->field) value
            where jsonb_typeof(value)<>'string' or length(value#>>'{}')>20000) then
            raise exception 'Delivery days and sales reps must be text lists within the size limit.';
          end if;
        end if;
      else
        if jsonb_typeof(item->field) not in ('string','null') then raise exception 'Operator field must be text: %',field; end if;
        if length(coalesce(item->>field,''))>20000 then raise exception 'Operator field is too long: %',field; end if;
      end if;
    end loop;
  end if;
  select * into section from public.team_app_records
    where record_type='team_section' and record_key=section_key
      and archived_at is null and deleted_at is null for update;
  if not found then raise exception 'Directory collection is unavailable. Please contact an administrator.'; end if;
  if jsonb_typeof(section.data->'value') is distinct from 'array' then raise exception 'Directory collection needs administrator review.'; end if;
  items:=section.data->'value'; item_id:=nullif(btrim(item->>'id'),'');
  if item_id is not null then
    select count(*) into matches from jsonb_array_elements(items) value where value->>'id'=item_id;
    if matches>1 then raise exception 'Duplicate directory identifiers need administrator review.'; end if;
    select value,ordinality::integer-1 into existing,item_index
      from jsonb_array_elements(items) with ordinality e(value,ordinality) where value->>'id'=item_id;
  end if;
  if existing is not null then
    if coalesce(existing->>'archivedAt','')<>'' then raise exception 'Archived directory items cannot be edited here.' using errcode='42501'; end if;
    if expected_updated_at is null or coalesce(existing->>'updatedAt','')<>expected_updated_at then
      raise exception 'This directory item changed since it was opened. Refresh it before saving.' using errcode='PT409';
    end if;
  else
    if expected_updated_at is not null then raise exception 'Directory item no longer exists. Refresh before saving.' using errcode='PT409'; end if;
    item_id:=gen_random_uuid()::text;
  end if;
  if kind='contact' then merged:=private.product_support_directory_merge_person(existing,item);
  else
    merged:=coalesce(existing,'{}'::jsonb);
    for field in select jsonb_object_keys(item) loop
      if field='id' then continue;
      elsif field in ('primaryContact','secondaryContact') then
        next_person:=private.product_support_directory_merge_person(merged->field,item->field);
        if nullif(next_person->>'id','') is null then next_person:=next_person || jsonb_build_object('id',gen_random_uuid()::text); end if;
        merged:=jsonb_set(merged,array[field],next_person,true);
      elsif field='contacts' then
        people:=case when jsonb_typeof(merged->field)='array' then merged->field else '[]'::jsonb end;
        person_ordinal:=0;
        for candidate in select value from jsonb_array_elements(item->field) value loop
          previous_person:=null; person_index:=null; incoming_id:=nullif(candidate->>'id','');
          if incoming_id is not null then
            select count(*) into person_count from jsonb_array_elements(people) value where value->>'id'=incoming_id;
            if person_count>1 then raise exception 'Duplicate operator contact identifiers need administrator review.'; end if;
            select value,ordinality::integer-1 into previous_person,person_index
              from jsonb_array_elements(people) with ordinality e(value,ordinality) where value->>'id'=incoming_id;
          end if;
          if previous_person is null and jsonb_typeof(people->person_ordinal)='object'
            and nullif(people->person_ordinal->>'id','') is null then
            previous_person:=people->person_ordinal; person_index:=person_ordinal;
          end if;
          next_person:=private.product_support_directory_merge_person(previous_person,candidate);
          if nullif(next_person->>'id','') is null then next_person:=next_person || jsonb_build_object('id',gen_random_uuid()::text); end if;
          if person_index is null then people:=people || jsonb_build_array(next_person);
          else people:=jsonb_set(people,array[person_index::text],next_person,false); end if;
          person_ordinal:=person_ordinal+1;
        end loop;
        merged:=jsonb_set(merged,array[field],people,true);
      elsif field='extraFields' then
        next_person:=private.product_support_directory_merge_person(merged,jsonb_build_object(field,item->field));
        merged:=jsonb_set(merged,array[field],next_person->field,true);
      else merged:=jsonb_set(merged,array[field],item->field,true);
      end if;
    end loop;
  end if;
  if kind='contact' then
    school_record:=nullif(btrim(merged->>'schoolName'),'') is not null
      or lower(coalesce(merged->>'category','')) in ('school','school contact','school contacts')
      or exists(select 1 from jsonb_array_elements(case when jsonb_typeof(merged->'groups')='array'
        then merged->'groups' else '[]'::jsonb end) value
        where jsonb_typeof(value)='string' and lower(btrim(value#>>'{}')) in ('school','school contact','school contacts'));
    if nullif(btrim(merged->>'name'),'') is null and not school_record then raise exception 'Contact name is required.'; end if;
    if coalesce(nullif(btrim(merged->>'organization'),''),nullif(btrim(merged->>'schoolName'),'')) is null then
      raise exception 'Contact organization or school name is required.';
    end if;
    merged:=merged || jsonb_build_object('name',btrim(coalesce(merged->>'name','')));
  elsif nullif(btrim(merged->>'operation'),'') is null then raise exception 'Operator name is required.';
  else merged:=merged || jsonb_build_object('operation',btrim(merged->>'operation'));
  end if;
  merged:=merged || jsonb_build_object('id',item_id,
    'createdAt',coalesce(nullif(existing->>'createdAt',''),now_text),'updatedAt',now_text);
  if existing is null then items:=items || jsonb_build_array(merged);
  else items:=jsonb_set(items,array[item_index::text],merged,false); end if;
  update public.team_app_records set data=jsonb_set(jsonb_set(jsonb_set(section.data,'{value}',items,true),
      '{savedAt}',to_jsonb(now_text),true),'{directoryRevision}',to_jsonb(directory_revision),true),
    updated_by=auth.uid(),updated_at=clock_timestamp()
    where id=section.id and record_type='team_section' and record_key=section_key;
  if kind='contact' then return private.product_support_directory_contact(merged);
  else return private.product_support_directory_operator(merged); end if;
end;
$function$;

CREATE OR REPLACE FUNCTION private.save_product_support_sample_item(section_key text, collection text, item jsonb, expected_updated_at text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  section public.team_app_records%rowtype; items jsonb; existing jsonb; merged jsonb;
  item_id text; item_index integer; matches integer; field text; actor public.profiles%rowtype;
  audit jsonb; activity jsonb; now_text text:=to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"');
begin
  if auth.uid() is null or not public.is_product_support() then raise exception 'Product Support access required.' using errcode='42501'; end if;
  if collection is null or collection not in ('samples','dot') then raise exception 'Choose a supported sample collection.' using errcode='42501'; end if;
  perform private.product_support_sample_check(item);
  select * into section from public.team_app_records
    where record_type='team_section' and record_key=section_key
      and archived_at is null and deleted_at is null for update;
  if not found then raise exception 'Sample collection is unavailable. Please contact an administrator.'; end if;
  if jsonb_typeof(section.data->'value') is distinct from 'array' then raise exception 'Sample collection needs administrator review.'; end if;
  items:=section.data->'value'; item_id:=nullif(btrim(item->>'id'),'');
  if item_id is not null then
    select count(*) into matches from jsonb_array_elements(items) value where value->>'id'=item_id;
    if matches>1 then raise exception 'Duplicate sample identifiers need administrator review.'; end if;
    select value,ordinality::integer-1 into existing,item_index
      from jsonb_array_elements(items) with ordinality e(value,ordinality) where value->>'id'=item_id;
    if existing is null then raise exception 'This sample no longer exists. Refresh before saving.' using errcode='PT409'; end if;
    if coalesce(existing->>'deletedAt','')<>'' then raise exception 'Deleted samples cannot be edited here.' using errcode='42501'; end if;
    if expected_updated_at is null or coalesce(existing->>'updatedAt','')<>expected_updated_at then
      raise exception 'This sample changed since it was opened. Refresh it before saving.' using errcode='PT409';
    end if;
  else
    if expected_updated_at is not null then raise exception 'This sample no longer exists. Refresh before saving.' using errcode='PT409'; end if;
    if collection<>'samples' then raise exception 'Add new receipts to Samples. Legacy DOT orders can only be updated here.' using errcode='42501'; end if;
    item_id:=gen_random_uuid()::text;
  end if;
  merged:=coalesce(existing,jsonb_build_object('attachments','[]'::jsonb,'archivedAt','',
    'status','Received','isDot',false,'directFromManufacturer',false,'addedToPo',false,'fedex',false,'usps',false));
  for field in select jsonb_object_keys(item) loop
    if field<>'id' then merged:=jsonb_set(merged,array[field],item->field,true); end if;
  end loop;
  if nullif(btrim(merged->>'product'),'') is null then raise exception 'Product or package description is required.'; end if;
  merged:=merged || jsonb_build_object('id',item_id,'product',btrim(merged->>'product'),
    'createdAt',coalesce(nullif(existing->>'createdAt',''),now_text),'updatedAt',now_text);
  if item ? 'status' then
    merged:=merged || jsonb_build_object('archivedAt',case when item->>'status' in ('Delivered','Delivered / Shown')
      then coalesce(nullif(existing->>'archivedAt',''),now_text) else '' end);
  end if;
  -- Preserve legacy DOT product objects for status-only edits. If the package
  -- description is intentionally edited, keep the legacy product text list in sync.
  if collection='dot' and item ? 'product' and item->>'product' is distinct from existing->>'product' then
    merged:=jsonb_set(merged,'{products}',coalesce((select jsonb_agg(jsonb_build_object('text',btrim(line)) order by ordinality)
      from unnest(string_to_array(item->>'product',E'\n')) with ordinality e(line,ordinality)
      where nullif(btrim(line),'') is not null),'[]'::jsonb),true);
  end if;
  select * into actor from public.profiles where id=auth.uid();
  audit:=jsonb_build_object('initials',upper(left(regexp_replace(coalesce(actor.display_name,'PS'),'[^A-Za-z]','','g'),2)),
    'name',coalesce(actor.display_name,''),'email',coalesce(actor.email,''),
    'action',case when existing is null then 'Created' else 'Updated' end,'at',now_text);
  activity:=case when jsonb_typeof(existing->'_activity')='array' then existing->'_activity' else '[]'::jsonb end;
  merged:=merged || jsonb_build_object('_audit',audit,'_activity',activity || jsonb_build_array(
    audit || jsonb_build_object('id',gen_random_uuid()::text,'fields',coalesce((select jsonb_agg(key)
      from jsonb_object_keys(item) key where key<>'id' and (merged->key) is distinct from (existing->key)),'[]'::jsonb))));
  if existing is null then items:=jsonb_build_array(merged)||items;
  else items:=jsonb_set(items,array[item_index::text],merged,false); end if;
  update public.team_app_records set data=jsonb_set(jsonb_set(jsonb_set(section.data,'{value}',items,true),
      '{savedAt}',to_jsonb(now_text),true),'{directoryRevision}',to_jsonb(gen_random_uuid()::text),true),
    updated_by=auth.uid(),updated_at=clock_timestamp()
    where id=section.id and record_type='team_section' and record_key=section_key;
  return private.product_support_sample(merged,collection);
end;
$function$;

CREATE OR REPLACE FUNCTION private.save_team_directory_section_value(section_key text, section_value jsonb, expected_updated_at text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare section public.team_app_records%rowtype; expected_at timestamptz; stored_at timestamptz;
  now_text text:=to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"');
  directory_revision text:=gen_random_uuid()::text;
begin
  if auth.uid() is null or not public.can_use_app() then
    raise exception 'Approved team access required.' using errcode='42501';
  end if;
  if jsonb_typeof(section_value) is distinct from 'object'
    or jsonb_typeof(section_value->'value') is distinct from 'array' then
    raise exception 'A directory section object with a value list is required.';
  end if;
  select * into section from public.team_app_records
    where record_type='team_section' and record_key=section_key for update;
  if found then
    if section.archived_at is not null or section.deleted_at is not null then
      raise exception 'Directory collection is unavailable. Please contact an administrator.';
    end if;
    if nullif(expected_updated_at,'') is null then
      raise exception 'The directory changed since it was loaded. Refresh before saving.' using errcode='PT409';
    end if;
    if nullif(section.data->>'directoryRevision','') is not null then
      if expected_updated_at is distinct from section.data->>'directoryRevision' then
        raise exception 'The directory changed since it was loaded. Refresh before saving.' using errcode='PT409';
      end if;
    else
      begin expected_at:=expected_updated_at::timestamptz;
      exception when invalid_datetime_format or datetime_field_overflow then
        raise exception 'The directory revision is invalid. Refresh before saving.' using errcode='PT409';
      end;
      if section.updated_at is distinct from expected_at then
        raise exception 'The directory changed since it was loaded. Refresh before saving.' using errcode='PT409';
      end if;
    end if;
    update public.team_app_records
      set data=jsonb_set(jsonb_set(section.data || section_value,'{savedAt}',to_jsonb(now_text),true),
        '{directoryRevision}',to_jsonb(directory_revision),true),updated_by=auth.uid(),updated_at=clock_timestamp()
      where id=section.id and record_type='team_section' and record_key=section_key
        and coalesce(data->>'directoryRevision','')=coalesce(section.data->>'directoryRevision','')
        and updated_at is not distinct from section.updated_at
      returning updated_at into stored_at;
    if not found then raise exception 'The directory changed. Refresh before saving.' using errcode='PT409'; end if;
  else
    if nullif(expected_updated_at,'') is not null then
      raise exception 'The directory no longer exists. Refresh before saving.' using errcode='PT409';
    end if;
    insert into public.team_app_records(record_type,record_key,data,created_by,updated_by,updated_at)
      values('team_section',section_key,jsonb_set(jsonb_set(section_value,'{savedAt}',to_jsonb(now_text),true),
        '{directoryRevision}',to_jsonb(directory_revision),true),
        auth.uid(),auth.uid(),clock_timestamp())
      on conflict(record_type,record_key) do nothing returning updated_at into stored_at;
    if not found then raise exception 'The directory changed. Refresh before saving.' using errcode='PT409'; end if;
  end if;
  -- This is an opaque revision token, deliberately independent of the existing
  -- transaction-constant updated_at trigger. Clients must not parse it as a date.
  return jsonb_build_object('updatedAt',directory_revision);
end;
$function$;

CREATE OR REPLACE FUNCTION public.save_product_support_product(collection text, product jsonb, expected_updated_at text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  section_key text; section public.team_app_records%rowtype; products jsonb;
  existing jsonb; merged jsonb; product_id text; item_index integer; field text;
  now_text text := to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"');
  mutable_fields text[] := array['description','vendor','distributor','distributorNumber','apn','supc',
    'manufacturerNumber','gtin','packaging','storage','brandType','brandName','category','so','k12','notes','attachments'];
  attachment jsonb; editor public.profiles%rowtype; audit jsonb; previous_activity jsonb;
begin
  if auth.uid() is null or not public.is_product_support() then
    raise exception 'Product Support access required.' using errcode='42501';
  end if;
  if collection not in ('stock','new') or collection is null then raise exception 'Invalid product collection.'; end if;
  if jsonb_typeof(product) is distinct from 'object' then raise exception 'A single product object is required.'; end if;
  for field in select jsonb_object_keys(product) loop
    if not (field=any(mutable_fields || array['id','createdAt','updatedAt','linkedStockId','stockLockedAt'])) then
      raise exception 'Product field is not editable: %',field;
    end if;
    if field not in ('attachments','k12') and jsonb_typeof(product->field) not in ('string','null') then
      raise exception 'Product field must be text: %',field;
    end if;
    if field not in ('attachments','k12') and length(coalesce(product->>field,''))>20000 then
      raise exception 'Product field is too long: %',field;
    end if;
  end loop;
  if product ? 'k12' and jsonb_typeof(product->'k12') <> 'boolean' then raise exception 'K-12 must be true or false.'; end if;
  if product ? 'attachments' then
    if jsonb_typeof(product->'attachments') <> 'array' then raise exception 'Attachments must be a list.'; end if;
    if jsonb_array_length(product->'attachments')>20 then raise exception 'Limit attachments to 20 per product.'; end if;
    for attachment in select x from jsonb_array_elements(product->'attachments') x loop
      if jsonb_typeof(attachment)<>'object' or nullif(btrim(attachment->>'name'),'') is null then raise exception 'Attachment name is required.'; end if;
      if exists(select 1 from jsonb_object_keys(attachment) k where k<>all(array['id','name','type','size','data','storageId','addedAt','category'])) then
        raise exception 'Unsupported attachment field.';
      end if;
      if exists(select 1 from jsonb_each(attachment) e(k,v) where jsonb_typeof(v) not in ('string','number','null')) then
        raise exception 'Invalid attachment metadata.';
      end if;
      if length(coalesce(attachment->>'data',''))>5592600
        or (attachment ? 'size' and (jsonb_typeof(attachment->'size')<>'number'
          or (attachment->>'size')::numeric<0 or (attachment->>'size')::numeric>4194304)) then
        raise exception 'Attachment exceeds 4 MB file limit.';
      end if;
      if coalesce(attachment->>'data','')<>'' and attachment->>'data' !~*
        '^data:(application/pdf|image/(png|jpeg|gif|webp)|text/plain|text/csv|application/msword|application/vnd[.]ms-(excel|powerpoint)|application/vnd[.]openxmlformats-officedocument[.](wordprocessingml[.]document|spreadsheetml[.]sheet|presentationml[.]presentation));base64,[a-z0-9+/=\r\n]*$' then
        raise exception 'Unsupported attachment data.';
      end if;
      if coalesce(attachment->>'category','Other') not in ('Specsheet','Coupon','POS','Other') then raise exception 'Invalid attachment category.'; end if;
    end loop;
  end if;
  section_key := case when collection='stock' then 'broker-whiteboard-stock-lists' else 'broker-whiteboard-market-visits-new-products' end;
  select * into section from public.team_app_records
    where record_type='team_section' and record_key=section_key and deleted_at is null and archived_at is null for update;
  if not found then raise exception 'Product collection is unavailable. Please contact an administrator.'; end if;
  if jsonb_typeof(section.data->'value') is distinct from 'array' then raise exception 'Product collection needs administrator review.'; end if;
  products := section.data->'value';
  product_id := nullif(btrim(product->>'id'),'');
  if product_id is not null then
    select e.value,e.ordinality::integer-1 into existing,item_index
    from jsonb_array_elements(products) with ordinality e(value,ordinality) where e.value->>'id'=product_id;
  end if;
  if existing is not null then
    if expected_updated_at is null or coalesce(existing->>'updatedAt','')<>expected_updated_at then
      raise exception 'This product changed since it was opened. Refresh the product before saving.' using errcode='PT409';
    end if;
    if collection='new' and (coalesce(existing->>'linkedStockId','')<>'' or coalesce(existing->>'stockLockedAt','')<>'') then
      raise exception 'This product has moved to stock. Edit its stock-list entry instead.' using errcode='42501';
    end if;
    if collection='new' and exists (
      select 1 from public.team_app_records s cross join lateral jsonb_array_elements(
        case when jsonb_typeof(s.data->'value')='array' then s.data->'value' else '[]'::jsonb end) p
      where s.record_type='team_section' and s.record_key='broker-whiteboard-stock-lists'
        and s.deleted_at is null and s.archived_at is null and private.product_support_same(existing,p)
    ) then raise exception 'This product is already stocked. Edit its stock-list entry instead.' using errcode='42501'; end if;
  else
    if expected_updated_at is not null and expected_updated_at<>'' then raise exception 'Product no longer exists. Refresh before saving.' using errcode='PT409'; end if;
    if product_id is null then product_id:=gen_random_uuid()::text; end if;
    if exists(select 1 from public.team_app_records s cross join lateral jsonb_array_elements(
      case when jsonb_typeof(s.data->'value')='array' then s.data->'value' else '[]'::jsonb end) p
      where s.record_key in ('broker-whiteboard-stock-lists','broker-whiteboard-market-visits-new-products') and p->>'id'=product_id) then
      raise exception 'Product identifier is already in use.';
    end if;
  end if;
  for field in select unnest(array['linkedStockId','stockLockedAt','createdAt','updatedAt']) loop
    if product ? field and coalesce(product->>field,'')<>coalesce(existing->>field,'') then
      raise exception 'Product field is managed by the app: %',field;
    end if;
  end loop;
  merged:=coalesce(existing,'{}'::jsonb);
  for field in select unnest(mutable_fields) loop
    if product ? field then merged:=jsonb_set(merged,array[field],product->field,true); end if;
  end loop;
  if nullif(btrim(merged->>'description'),'') is null or nullif(btrim(merged->>'vendor'),'') is null then
    raise exception 'Product description and vendor are required.';
  end if;
  if collection='stock' and nullif(btrim(merged->>'distributor'),'') is null then raise exception 'Choose a distributor.'; end if;
  if regexp_replace(lower(translate(coalesce(merged->>'vendor',''),'éÉ','ee')),'[^a-z0-9]','','g') in ('nestle','nestleprofessional') then
    merged:=jsonb_set(merged,'{vendor}','"Nestle"'::jsonb,true);
  end if;
  merged:=merged || jsonb_build_object('id',product_id,'description',btrim(merged->>'description'),
    'vendor',btrim(merged->>'vendor'),'createdAt',coalesce(nullif(existing->>'createdAt',''),now_text),'updatedAt',now_text);
  select * into editor from public.profiles where id=auth.uid();
  audit:=jsonb_build_object('initials',upper(left(regexp_replace(coalesce(editor.display_name,'PS'),'[^A-Za-z]','','g'),2)),
    'name',coalesce(editor.display_name,''),'email',coalesce(editor.email,''),
    'action',case when existing is null then 'Created' else 'Updated' end,'at',now_text);
  previous_activity:=case when jsonb_typeof(existing->'_activity')='array' then existing->'_activity' else '[]'::jsonb end;
  merged:=merged || jsonb_build_object('_audit',audit,'_activity',previous_activity || jsonb_build_array(
    audit || jsonb_build_object('id',gen_random_uuid()::text,'fields',coalesce((
      select jsonb_agg(k) from unnest(mutable_fields) k
      where (merged->k) is distinct from (existing->k)
    ),'[]'::jsonb))
  ));
  if existing is null then products:=jsonb_build_array(merged)||products;
  else products:=jsonb_set(products,array[item_index::text],merged,false); end if;
  update public.team_app_records set data=jsonb_set(jsonb_set(section.data,'{value}',products,true),'{savedAt}',to_jsonb(now_text),true),
    updated_by=auth.uid() where id=section.id;
  return private.product_support_product(merged);
end; $function$;


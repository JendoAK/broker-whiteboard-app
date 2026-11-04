DO $guard$
BEGIN
  if md5(pg_get_functiondef('public.get_product_support_workspace()'::regprocedure)) <> '5d2c64b93022ef86f2f5b87d05035f18' then raise exception 'Product Support workspace changed during repair'; end if;
END;
$guard$;

CREATE OR REPLACE FUNCTION public.get_product_support_workspace()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare result jsonb;
begin
  if auth.uid() is null or not public.is_product_support() then
    raise exception 'Product Support access required.' using errcode='42501';
  end if;
  with product_sections as (
    select record_key,case when jsonb_typeof(data->'value')='array' then data->'value' else '[]'::jsonb end as products
    from public.team_app_records where record_type='team_section'
      and record_key in ('broker-whiteboard-stock-lists','broker-whiteboard-market-visits-new-products')
      and archived_at is null and deleted_at is null
  ), product_identities as materialized (
    -- Normalize each product once. Candidate matching must remain a superset of
    -- product_support_same; the existing helper makes the final decision.
    select s.record_key,e.ordinality,e.product,
      coalesce(e.product->>'id','') as product_id,
      private.product_support_identity(e.product,'apn') as apn,
      private.product_support_identity(e.product,'supc') as supc,
      private.product_support_identity(e.product,'gtin') as gtin,
      private.product_support_identity(e.product,'distributor') as distributor,
      private.product_support_identity(e.product,'distributorNumber') as distributor_number,
      private.product_support_identity(e.product,'vendor') as vendor,
      private.product_support_identity(e.product,'manufacturerNumber') as manufacturer_number,
      private.product_support_identity(e.product,'description') as description,
      private.product_support_identity(e.product,'packaging') as packaging
    from product_sections s cross join lateral jsonb_array_elements(s.products)
      with ordinality e(product,ordinality)
    where jsonb_typeof(e.product)='object'
  ), event_sources as (
    select 0 as priority, record_key<>'broker-whiteboard-market-visits-pc-shared' as shared_event, record_key, data
    from public.team_app_records where record_type='team_section'
      and record_key in ('broker-whiteboard-market-visits-pc-shared','broker-whiteboard-market-visits-vendor',
        'broker-whiteboard-market-visits-testkitchen','broker-whiteboard-market-visits-foodshow')
      and archived_at is null and deleted_at is null
    union all
    select case when r.record_key='broker-whiteboard-market-visits-personal' then 1 else 2 end,
      false,r.record_key,r.data from public.app_records r
    join public.profiles p on p.id=r.owner_id and p.role in ('member','admin','super_user')
    where r.record_type='app_section' and r.record_key in (
      'broker-whiteboard-market-visits-personal','broker-whiteboard-market-visits-pc','broker-whiteboard-market-visits')
      and r.archived_at is null and r.deleted_at is null
  ), events as (
    select distinct on (item->>'id') item,shared_event from event_sources s
    cross join lateral jsonb_array_elements(case when jsonb_typeof(s.data->'value')='array'
      then s.data->'value' else '[]'::jsonb end) item
    where jsonb_typeof(item)='object' and nullif(item->>'id','') is not null
      and (s.shared_event or coalesce(item->>'type','personal') in ('personal','pc'))
    order by item->>'id',priority
  ) select jsonb_build_object(
    'stockProducts',coalesce((select jsonb_agg(private.product_support_product(p))
      from product_sections s cross join lateral jsonb_array_elements(s.products) p
      where s.record_key='broker-whiteboard-stock-lists' and jsonb_typeof(p)='object'),'[]'::jsonb),
    'newProducts',coalesce((select jsonb_agg(private.product_support_product(p.product) || jsonb_build_object(
      'readOnly',coalesce(p.product->>'linkedStockId','')<>'' or coalesce(p.product->>'stockLockedAt','')<>'' or exists(
        select 1 from product_identities st
        where st.record_key='broker-whiteboard-stock-lists' and case when
          (p.product_id<>'' and p.product_id=st.product_id)
          or (p.apn<>'' and p.apn=st.apn)
          or (p.supc<>'' and p.supc=st.supc)
          or (p.gtin<>'' and p.gtin=st.gtin)
          or (p.distributor<>'' and p.distributor=st.distributor
            and p.distributor_number<>'' and p.distributor_number=st.distributor_number)
          or (p.vendor<>'' and p.vendor=st.vendor and (
            (p.manufacturer_number<>'' and p.manufacturer_number=st.manufacturer_number)
            or (p.description<>'' and p.description=st.description
              and p.packaging<>'' and p.packaging=st.packaging)))
          then private.product_support_same(p.product,st.product) else false end
      )) order by p.ordinality)
      from product_identities p
      where p.record_key='broker-whiteboard-market-visits-new-products'),'[]'::jsonb),
    'events',coalesce((select jsonb_agg(private.product_support_event(item,shared_event)) from events),'[]'::jsonb),
    'savedAt',clock_timestamp()
  ) into result;
  return result;
end; $function$;


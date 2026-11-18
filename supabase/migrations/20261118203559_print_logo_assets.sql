-- One immutable row per optimized image, shared across both Print Center workspaces.
create table public.print_logo_assets (
  name text not null check (length(btrim(name)) between 1 and 120),
  image_data text not null check (
    octet_length(image_data) <= 4194304 and
    image_data ~ '^data:image/(png;base64,iVBORw0KGgo|jpeg;base64,/9j/)'
  ),
  width integer not null check (width between 1 and 1200),
  height integer not null check (height between 1 and 360),
  thumbnail text not null check (
    octet_length(thumbnail) <= 48000 and
    thumbnail ~ '^data:image/png;base64,iVBORw0KGgo'
  ),
  id text generated always as (
    encode(sha256(decode(split_part(image_data, ',', 2), 'base64')), 'hex')
  ) stored primary key
);

alter table public.print_logo_assets enable row level security;
revoke all on public.print_logo_assets from public, anon, authenticated;
grant select, insert on public.print_logo_assets to authenticated;

create policy print_logos_read on public.print_logo_assets for select to authenticated
  using ((select public.can_use_app()) or (select public.is_product_support()));
create policy print_logos_add on public.print_logo_assets for insert to authenticated
  with check ((select public.can_use_app()) or (select public.is_product_support()));

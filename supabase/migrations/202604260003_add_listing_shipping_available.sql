alter table public.listings
add column if not exists shipping_available boolean not null default false;

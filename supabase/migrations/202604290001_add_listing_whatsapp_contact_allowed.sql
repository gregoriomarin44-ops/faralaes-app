alter table public.listings
add column if not exists whatsapp_contact_allowed boolean not null default false;

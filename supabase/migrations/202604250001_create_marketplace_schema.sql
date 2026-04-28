-- Faralaes MVP marketplace schema.
-- No payments: buyers and sellers arrange the transaction outside the app.

create extension if not exists pgcrypto;

create type public.listing_condition as enum (
  'new',
  'like_new',
  'good'
);

create type public.listing_status as enum (
  'draft',
  'pending',
  'published',
  'reserved',
  'sold',
  'archived',
  'rejected'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  location text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length check (username is null or char_length(username) between 3 and 30),
  constraint profiles_username_format check (username is null or username ~ '^[a-zA-Z0-9_\.]+$')
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  size text,
  color text,
  condition public.listing_condition not null,
  price_cents integer not null,
  currency text not null default 'EUR',
  location text,
  status public.listing_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('spanish', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(category, '')), 'C') ||
    setweight(to_tsvector('spanish', coalesce(color, '')), 'D') ||
    setweight(to_tsvector('spanish', coalesce(location, '')), 'D')
  ) stored,
  constraint listings_title_length check (char_length(title) between 3 and 120),
  constraint listings_description_length check (char_length(description) between 10 and 2000),
  constraint listings_price_non_negative check (price_cents >= 0),
  constraint listings_currency_iso check (currency ~ '^[A-Z]{3}$'),
  constraint listings_published_at_required check (
    status <> 'published' or published_at is not null
  )
);

create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  storage_path text not null unique,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint listing_images_sort_order_non_negative check (sort_order >= 0)
);

create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_buyer_is_not_seller check (buyer_id <> seller_id),
  constraint conversations_unique_listing_buyer unique (listing_id, buyer_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint messages_body_length check (char_length(body) between 1 and 2000)
);

create index listings_status_published_at_idx
  on public.listings (status, published_at desc)
  where status = 'published';

create index listings_seller_id_idx on public.listings (seller_id);
create index listings_category_idx on public.listings (category);
create index listings_price_cents_idx on public.listings (price_cents);
create index listings_search_vector_idx on public.listings using gin (search_vector);

create index listing_images_listing_id_sort_order_idx
  on public.listing_images (listing_id, sort_order);

create index favorites_listing_id_idx on public.favorites (listing_id);

create index conversations_buyer_id_updated_at_idx
  on public.conversations (buyer_id, updated_at desc);

create index conversations_seller_id_updated_at_idx
  on public.conversations (seller_id, updated_at desc);

create index conversations_listing_id_idx on public.conversations (listing_id);

create index messages_conversation_id_created_at_idx
  on public.messages (conversation_id, created_at);

create index messages_sender_id_idx on public.messages (sender_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger listings_set_updated_at
before update on public.listings
for each row execute function public.set_updated_at();

create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

create or replace function public.set_listing_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published'
    and (tg_op = 'INSERT' or old.status is distinct from 'published')
    and new.published_at is null then
    new.published_at = now();
  end if;

  if new.status <> 'published' then
    new.published_at = null;
  end if;

  return new;
end;
$$;

create trigger listings_set_published_at
before insert or update of status on public.listings
for each row execute function public.set_listing_published_at();

create or replace function public.ensure_conversation_seller_matches_listing()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.listings
    where id = new.listing_id
      and seller_id = new.seller_id
  ) then
    raise exception 'conversation seller must match listing seller';
  end if;

  return new;
end;
$$;

create trigger conversations_validate_seller
before insert or update of listing_id, seller_id on public.conversations
for each row execute function public.ensure_conversation_seller_matches_listing();

create or replace function public.ensure_message_sender_is_participant()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.conversations
    where id = new.conversation_id
      and new.sender_id in (buyer_id, seller_id)
  ) then
    raise exception 'message sender must be a conversation participant';
  end if;

  update public.conversations
  set last_message_at = new.created_at,
      updated_at = now()
  where id = new.conversation_id;

  return new;
end;
$$;

create trigger messages_validate_sender
before insert on public.messages
for each row execute function public.ensure_message_sender_is_participant();

create or replace function public.protect_message_immutable_fields()
returns trigger
language plpgsql
as $$
begin
  if new.conversation_id <> old.conversation_id
    or new.sender_id <> old.sender_id
    or new.body <> old.body
    or new.created_at <> old.created_at then
    raise exception 'only message read_at can be updated';
  end if;

  return new;
end;
$$;

create trigger messages_protect_immutable_fields
before update on public.messages
for each row execute function public.protect_message_immutable_fields();

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.favorites enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Profiles are readable by everyone"
on public.profiles for select
using (true);

create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can insert their own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Published listings are readable by everyone"
on public.listings for select
using (status = 'published' or auth.uid() = seller_id);

create policy "Authenticated users can create their own listings"
on public.listings for insert
with check (auth.uid() = seller_id);

create policy "Sellers can update their own listings"
on public.listings for update
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);

create policy "Sellers can delete their own draft listings"
on public.listings for delete
using (auth.uid() = seller_id and status in ('draft', 'rejected', 'archived'));

create policy "Images are readable for visible listings"
on public.listing_images for select
using (
  exists (
    select 1
    from public.listings
    where listings.id = listing_images.listing_id
      and (listings.status = 'published' or listings.seller_id = auth.uid())
  )
);

create policy "Sellers can add images to their own listings"
on public.listing_images for insert
with check (
  exists (
    select 1
    from public.listings
    where listings.id = listing_images.listing_id
      and listings.seller_id = auth.uid()
      and listing_images.storage_path like auth.uid()::text || '/' || listings.id::text || '/%'
  )
);

create policy "Sellers can update images on their own listings"
on public.listing_images for update
using (
  exists (
    select 1
    from public.listings
    where listings.id = listing_images.listing_id
      and listings.seller_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.listings
    where listings.id = listing_images.listing_id
      and listings.seller_id = auth.uid()
      and listing_images.storage_path like auth.uid()::text || '/' || listings.id::text || '/%'
  )
);

create policy "Sellers can delete images from their own listings"
on public.listing_images for delete
using (
  exists (
    select 1
    from public.listings
    where listings.id = listing_images.listing_id
      and listings.seller_id = auth.uid()
  )
);

create policy "Users can read their own favorites"
on public.favorites for select
using (auth.uid() = user_id);

create policy "Users can favorite published listings"
on public.favorites for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.listings
    where listings.id = favorites.listing_id
      and listings.status = 'published'
  )
);

create policy "Users can remove their own favorites"
on public.favorites for delete
using (auth.uid() = user_id);

create policy "Participants can read conversations"
on public.conversations for select
using (auth.uid() in (buyer_id, seller_id));

create policy "Buyers can start conversations on published listings"
on public.conversations for insert
with check (
  auth.uid() = buyer_id
  and buyer_id <> seller_id
  and exists (
    select 1
    from public.listings
    where listings.id = conversations.listing_id
      and listings.seller_id = conversations.seller_id
      and listings.status = 'published'
  )
);

create policy "Participants can update conversations"
on public.conversations for update
using (auth.uid() in (buyer_id, seller_id))
with check (auth.uid() in (buyer_id, seller_id));

create policy "Participants can read messages"
on public.messages for select
using (
  exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and auth.uid() in (conversations.buyer_id, conversations.seller_id)
  )
);

create policy "Participants can send messages"
on public.messages for insert
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and auth.uid() in (conversations.buyer_id, conversations.seller_id)
  )
);

create policy "Message sender can update read state"
on public.messages for update
using (
  exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and auth.uid() in (conversations.buyer_id, conversations.seller_id)
  )
)
with check (
  exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and auth.uid() in (conversations.buyer_id, conversations.seller_id)
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images',
  'listing-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Listing images are readable for published listings and owners"
on storage.objects for select
using (
  bucket_id = 'listing-images'
  and (
    owner = auth.uid()
    or exists (
      select 1
      from public.listing_images
      join public.listings on listings.id = listing_images.listing_id
      where listing_images.storage_path = storage.objects.name
        and listings.status = 'published'
    )
  )
);

create policy "Users can upload listing images into their own folder"
on storage.objects for insert
with check (
  bucket_id = 'listing-images'
  and auth.role() = 'authenticated'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "Users can update listing images in their own folder"
on storage.objects for update
using (
  bucket_id = 'listing-images'
  and owner = auth.uid()
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'listing-images'
  and owner = auth.uid()
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "Users can delete listing images in their own folder"
on storage.objects for delete
using (
  bucket_id = 'listing-images'
  and owner = auth.uid()
  and split_part(name, '/', 1) = auth.uid()::text
);

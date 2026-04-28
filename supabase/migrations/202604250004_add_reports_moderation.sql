alter table public.profiles
add column if not exists is_admin boolean not null default false;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint reports_reason_check check (reason in ('inappropriate', 'scam', 'wrong_item', 'other')),
  constraint reports_status_check check (status in ('pending', 'reviewed', 'dismissed')),
  constraint reports_unique_reporter_listing unique (listing_id, reporter_id)
);

create index if not exists reports_status_created_at_idx on public.reports (status, created_at desc);
create index if not exists reports_listing_id_idx on public.reports (listing_id);
create index if not exists reports_reporter_id_idx on public.reports (reporter_id);

alter table public.reports enable row level security;

create policy "Users can create one report per listing"
on public.reports for insert
with check (auth.uid() = reporter_id);

create policy "Users can read their own reports"
on public.reports for select
using (
  auth.uid() = reporter_id
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
);

create policy "Admins can update reports"
on public.reports for update
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
);

create policy "Admins can update any listing"
on public.listings for update
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
);

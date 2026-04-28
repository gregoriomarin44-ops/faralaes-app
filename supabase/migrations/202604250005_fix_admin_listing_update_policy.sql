alter table public.profiles
add column if not exists is_admin boolean not null default false;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  );
$$;

revoke all on function public.current_user_is_admin() from public;
grant execute on function public.current_user_is_admin() to authenticated;

drop policy if exists "Admins can update any listing" on public.listings;

create policy "Admins can update any listing"
on public.listings
for update
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists "Admins can read any listing" on public.listings;

create policy "Admins can read any listing"
on public.listings
for select
using (public.current_user_is_admin());

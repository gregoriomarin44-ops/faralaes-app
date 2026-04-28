alter table public.profiles
add column if not exists phone_verified boolean not null default false,
add column if not exists seller_badge text;

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

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_seller_badge_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_seller_badge_check
    check (seller_badge is null or seller_badge in ('featured'));
  end if;
end $$;

drop policy if exists "Admins can update seller trust badges" on public.profiles;

create policy "Admins can update seller trust badges"
on public.profiles
for update
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

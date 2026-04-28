alter table public.listings
add column if not exists original_price_cents integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'listings_original_price_non_negative'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
    add constraint listings_original_price_non_negative
    check (original_price_cents is null or original_price_cents >= 0);
  end if;
end $$;

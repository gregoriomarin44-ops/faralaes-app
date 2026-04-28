drop policy if exists "Sellers can delete their own draft listings" on public.listings;

create policy "Sellers can delete their own listings"
on public.listings for delete
using (auth.uid() = seller_id);

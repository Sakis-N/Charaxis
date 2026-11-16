-- Δωρεάν μεταφορικά από ένα ποσό και πάνω (ρύθμιση από το admin → Μεταφορικά).
-- Εφαρμόστηκε στη βάση στις 2026-11-16. Το create_order έχει την ίδια λογική με πριν
-- και επιπλέον μηδενίζει τα μεταφορικά όταν (υποσύνολο − έκπτωση) ≥ free_shipping_from().

create table if not exists public.shop_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.shop_settings enable row level security;
create policy "shop_settings public read" on public.shop_settings for select using (true);
create policy "shop_settings admin write" on public.shop_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.shop_settings (key, value) values ('free_shipping_from', '50'::jsonb)
on conflict (key) do nothing;

create or replace function public.free_shipping_from()
returns numeric
language sql
stable
security definer
set search_path to 'public'
as $$
  select case when jsonb_typeof(value) = 'number' and (value::text)::numeric > 0 then (value::text)::numeric end
  from shop_settings where key = 'free_shipping_from';
$$;

-- Στο public.create_order, πριν το insert into orders:
--   free_from := free_shipping_from();
--   if free_from is not null and subtotal - discount >= free_from then ship := 0; end if;

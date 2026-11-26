-- Κοστολόγηση laser (admin → Κοστολόγηση). Μόνο για τον διαχειριστή, τίποτα δημόσιο.
--  cost_items:    πλάκες (kind = 'sheet', με διαστάσεις) και έξτρα ανά κομμάτι (kind = 'extra')
--  cost_settings: χρέωση laser ανά λεπτό, πραγματικό κόστος μηχανής ανά λεπτό
--  cost_quotes:   αποθηκευμένες προσφορές (προαιρετικά)

create table if not exists public.cost_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('sheet', 'extra')),
  name text not null,
  width_cm numeric check (width_cm is null or width_cm > 0),
  height_cm numeric check (height_cm is null or height_cm > 0),
  price numeric not null check (price >= 0),
  created_at timestamptz not null default now(),
  check (kind = 'extra' or (width_cm is not null and height_cm is not null))
);

create table if not exists public.cost_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.cost_quotes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer text not null default '',
  title text not null default '',
  quantity int not null default 1 check (quantity >= 1),
  unit_price numeric not null,
  total numeric not null,
  details jsonb not null default '{}'::jsonb,
  notes text
);

alter table public.cost_items enable row level security;
alter table public.cost_settings enable row level security;
alter table public.cost_quotes enable row level security;

create policy "cost_items admin" on public.cost_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "cost_settings admin" on public.cost_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "cost_quotes admin" on public.cost_quotes for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.cost_settings (key, value) values
  ('laser_rate_per_min', '1'::jsonb),
  ('machine_cost_per_min', '0.02'::jsonb)
on conflict (key) do nothing;

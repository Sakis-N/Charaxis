-- Έκπτωση σε όλο το site για συγκεκριμένο διάστημα (Black Friday 2026: -40%, 25–30/11).
-- Η ρύθμιση ζει στο shop_settings.key = 'sale' και πρέπει να συμφωνεί με το lib/sale.ts
-- (το site τη χρησιμοποιεί μόνο για να δείχνει τις τιμές· εδώ γίνεται η πραγματική χρέωση).
-- Η έκπτωση εφαρμόζεται στην τιμή ανά τεμάχιο (στρογγυλεμένη στο λεπτό), πριν από τον έλεγχο
-- για δωρεάν μεταφορικά. Όσο τρέχει η προσφορά, τα κουπόνια ΔΕΝ ισχύουν (δεν συνδυάζονται). Εκτός διαστήματος δεν αλλάζει τίποτα.
-- Για να σταματήσει νωρίτερα: update shop_settings set value = jsonb_set(value,'{percent}','0') where key='sale';

insert into public.shop_settings (key, value) values (
  'sale',
  '{"name": "Black Friday", "percent": 40, "starts_at": "2026-11-25T00:00:00+02:00", "ends_at": "2026-12-01T00:00:00+02:00"}'::jsonb
)
on conflict (key) do update set value = excluded.value, updated_at = now();

create or replace function public.sale_percent()
returns numeric
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce((
    select least(greatest((value->>'percent')::numeric, 0), 90)
    from shop_settings
    where key = 'sale'
      and now() >= (value->>'starts_at')::timestamptz
      and now() <  (value->>'ends_at')::timestamptz
  ), 0);
$$;

create or replace function public.create_order(p_customer jsonb, p_items jsonb, p_shipping_method text, p_shipping_address jsonb, p_coupon text, p_payment_provider text, p_notes text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  it jsonb;
  prod record;
  qty int;
  subtotal numeric := 0;
  discount numeric := 0;
  ship numeric := 0;
  sm record;
  cp record;
  cp_id uuid := null;
  pc text;
  oid uuid;
  line numeric;
  unit numeric;
  free_from numeric;
  sale_pct numeric := sale_percent();
begin
  if coalesce(p_customer->>'name','') = '' or coalesce(p_customer->>'email','') = '' then
    raise exception 'Λείπουν στοιχεία πελάτη';
  end if;
  if p_customer->>'email' !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Μη έγκυρο email';
  end if;
  if p_payment_provider not in ('stripe','bank_transfer','iris') then
    raise exception 'Μη έγκυρος τρόπος πληρωμής';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 30 then
    raise exception 'Μη έγκυρο καλάθι';
  end if;

  select * into sm from shipping_methods where code = p_shipping_method and active;
  if not found then raise exception 'Μη έγκυρος τρόπος αποστολής'; end if;

  for it in select * from jsonb_array_elements(p_items) loop
    select * into prod from products where id = (it->>'product_id')::uuid and active;
    if not found then raise exception 'Το προϊόν δεν είναι διαθέσιμο'; end if;
    qty := (it->>'quantity')::int;
    if qty is null or qty < 1 or qty > 5000 then raise exception 'Μη έγκυρη ποσότητα'; end if;
    unit := product_unit_price(prod.pricing, prod.base_price, it->'custom_design'->>'variant', qty);
    unit := round(unit * (100 - sale_pct) / 100, 2);
    subtotal := subtotal + unit * qty;
  end loop;

  ship := sm.cost;
  if sm.code = 'acs' then
    pc := regexp_replace(coalesce(p_shipping_address->>'postcode',''), '\s', '', 'g');
    if pc !~ '^[0-9]{5}$' then raise exception 'Μη έγκυρος ΤΚ'; end if;
    if sm.remote_cost is not null and exists (
      select 1 from acs_remote_areas r where pc like r.postcode_prefix || '%'
    ) then
      ship := sm.remote_cost;
    end if;
  end if;

  if coalesce(p_coupon,'') <> '' and sale_pct > 0 then
    raise exception 'Τα κουπόνια δεν ισχύουν όσο τρέχει η προσφορά (η έκπτωση είναι ήδη στις τιμές)';
  end if;

  if coalesce(p_coupon,'') <> '' then
    select * into cp from coupons where lower(code) = lower(p_coupon)
      and active and (expires_at is null or expires_at > now())
      and (max_uses is null or times_used < max_uses);
    if not found then raise exception 'Μη έγκυρο κουπόνι'; end if;
    cp_id := cp.id;
    if cp.discount_type = 'percentage' then
      discount := round(subtotal * cp.discount_value / 100, 2);
    else
      discount := cp.discount_value;
    end if;
    discount := least(discount, subtotal);
  end if;

  free_from := free_shipping_from();
  if free_from is not null and subtotal - discount >= free_from then
    ship := 0;
  end if;

  insert into orders (customer_name, customer_email, customer_phone, shipping_address,
    shipping_method, shipping_cost, coupon_id, subtotal, discount_amount, total,
    status, payment_provider, payment_status, notes)
  values (p_customer->>'name', p_customer->>'email', p_customer->>'phone', p_shipping_address,
    sm.code, ship, cp_id, subtotal, discount, subtotal - discount + ship,
    'pending', p_payment_provider, 'unpaid', left(p_notes, 1000))
  returning id into oid;

  for it in select * from jsonb_array_elements(p_items) loop
    select * into prod from products where id = (it->>'product_id')::uuid;
    qty := (it->>'quantity')::int;
    unit := product_unit_price(prod.pricing, prod.base_price, it->'custom_design'->>'variant', qty);
    unit := round(unit * (100 - sale_pct) / 100, 2);
    line := unit * qty;
    insert into order_items (order_id, product_id, product_name_snapshot, unit_price, quantity, custom_design, line_total)
    values (oid, prod.id, prod.name, unit, qty, it->'custom_design', line);
  end loop;

  if cp_id is not null then
    update coupons set times_used = times_used + 1 where id = cp_id;
  end if;

  return jsonb_build_object('order_id', oid, 'subtotal', subtotal, 'discount', discount,
    'shipping', ship, 'total', subtotal - discount + ship);
end;
$function$;

-- Κουπόνια: όσο τρέχει η προσφορά απαντά «μη έγκυρο» με σαφές μήνυμα.
create or replace function public.validate_coupon(coupon_code text)
 returns table(valid boolean, discount_type text, discount_value numeric, message text)
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  c record;
begin
  if sale_percent() > 0 then
    return query select false, null::text, null::numeric, 'Τα κουπόνια δεν ισχύουν όσο τρέχει η προσφορά. Η έκπτωση είναι ήδη στις τιμές.';
    return;
  end if;

  select * into c from public.coupons where lower(code) = lower(coupon_code);

  if not found then
    return query select false, null::text, null::numeric, 'Ο κωδικός δεν βρέθηκε';
    return;
  end if;

  if not c.active then
    return query select false, null::text, null::numeric, 'Ο κωδικός δεν είναι ενεργός';
    return;
  end if;

  if c.expires_at is not null and c.expires_at < now() then
    return query select false, null::text, null::numeric, 'Ο κωδικός έχει λήξει';
    return;
  end if;

  if c.max_uses is not null and c.times_used >= c.max_uses then
    return query select false, null::text, null::numeric, 'Ο κωδικός έχει εξαντληθεί';
    return;
  end if;

  return query select true, c.discount_type, c.discount_value, 'OK';
end;
$function$;

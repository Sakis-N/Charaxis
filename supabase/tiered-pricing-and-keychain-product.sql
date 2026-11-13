-- Κλιμακωτή τιμολόγηση ανά ποσότητα + προϊόν «Ξύλινο Μπρελόκ 4×4 cm για Καταστήματα».
-- Συμβατό προς τα πίσω: προϊόντα χωρίς `pricing` υπολογίζονται όπως πριν (base_price × ποσότητα).

alter table public.products add column if not exists pricing jsonb;

create or replace function public.product_unit_price(p_pricing jsonb, p_base numeric, p_variant text, p_qty int)
returns numeric
language plpgsql
immutable
set search_path to 'public'
as $$
declare
  v jsonb;
  mins jsonb;
  idx int := -1;
  i int;
begin
  if p_pricing is null then
    return p_base;
  end if;
  if p_variant is null then
    raise exception 'Διάλεξε τι θα χαραχτεί';
  end if;
  v := p_pricing->'variants'->p_variant;
  if v is null then
    raise exception 'Μη έγκυρη επιλογή χάραξης';
  end if;
  mins := p_pricing->'min_qty';
  for i in 0 .. jsonb_array_length(mins) - 1 loop
    if (mins->>i)::int <= p_qty then
      idx := i;
    end if;
  end loop;
  if idx < 0 then
    raise exception 'Μη έγκυρη ποσότητα';
  end if;
  return (v->'prices'->>idx)::numeric;
end
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

-- Το προϊόν μπαίνει ΑΝΕΝΕΡΓΟ· ενεργοποιείται (active = true) αφού γίνει το deploy του νέου κώδικα.
insert into public.products
  (category_id, name, slug, description, material, base_price, dimensions, is_customizable, images, custom_fields, pricing, active, sort_order)
values (
  '210d18e1-7878-4c88-8395-92a7a6df44cb',
  'Ξύλινο Μπρελόκ 4×4 cm για Καταστήματα',
  'xylino-mprelok-4x4-gia-katastimata',
  $d$Το μπρελόκ με το λογότυπο ή το όνομα του καταστήματός σου: μια μικρή, χρήσιμη λεπτομέρεια που οι πελάτες σου κρατούν και θυμούνται. Χαραγμένο με laser σε ξύλο, διάσταση 4×4 cm, στη μία ή και στις δύο όψεις. Ιδανικό για καφέ, εστιατόρια, ξενοδοχεία, καταστήματα και εκδηλώσεις. Όσο μεγαλύτερη η ποσότητα, τόσο χαμηλότερη η τιμή ανά τεμάχιο.$d$,
  'Ξύλο',
  0.55,
  '4 x 4 cm',
  true,
  '["/products/keychain-4x4-1.jpg","/products/keychain-4x4-2.jpg"]'::jsonb,
  $f$[{"id": "front", "type": "side", "label": "Μπροστινή όψη", "description": "Διάλεξε τι θα χαραχτεί στη μία όψη του μπρελόκ.", "placeholder": "π.χ. Καφέ Ηλιοτρόπιο"}, {"id": "back", "type": "side", "label": "Πίσω όψη", "description": "Προαιρετικά, χάραξη και στην πίσω όψη — ή άφησέ την χωρίς χάραξη.", "placeholder": "π.χ. Καφέ Ηλιοτρόπιο"}, {"id": "notes", "type": "textarea", "label": "Σχόλια ή οδηγίες (προαιρετικά)", "placeholder": "π.χ. θέλω τα γράμματα με πιο χοντρή γραμματοσειρά"}]$f$::jsonb,
  $p${"min_qty": [1, 3, 10, 25, 50, 100], "variants": {"logo_logo": {"label": "Λογότυπο και στις δύο όψεις", "prices": [4, 2.5, 1.8, 1.4, 1.1, 0.85]}, "logo": {"label": "Λογότυπο σε μία όψη", "prices": [3.55, 2.2, 1.6, 1.25, 0.95, 0.75]}, "logo_text": {"label": "Λογότυπο στη μία όψη + γράμματα στην άλλη", "prices": [3.75, 2.35, 1.7, 1.3, 1.05, 0.8]}, "text": {"label": "Γράμματα σε μία όψη", "prices": [2.6, 1.6, 1.15, 0.9, 0.7, 0.55]}, "text_text": {"label": "Γράμματα και στις δύο όψεις", "prices": [3.05, 1.9, 1.4, 1.05, 0.85, 0.65]}}, "min_price": 0.55}$p$::jsonb,
  false,
  0
);

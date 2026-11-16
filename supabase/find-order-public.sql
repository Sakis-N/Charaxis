-- Ο πελάτης βρίσκει την παραγγελία του στη σελίδα /parakolouthisi με τον κωδικό
-- (#XXXXXXXX, τα πρώτα 8 ψηφία του id) και το email ή το τηλέφωνο που έδωσε.
-- Μόνο ανάγνωση: επιστρέφει το id ώστε να ανοίξει η σελίδα /paraggelia/[id].
create or replace function public.find_order_public(p_code text, p_contact text)
returns uuid
language sql
stable
security definer
set search_path to 'public'
as $$
  with q as (
    select lower(regexp_replace(coalesce(p_code, ''), '[^0-9a-fA-F]', '', 'g')) as code,
           lower(trim(coalesce(p_contact, ''))) as contact,
           regexp_replace(coalesce(p_contact, ''), '[^0-9]', '', 'g') as digits
  )
  select o.id
  from orders o, q
  where length(q.code) >= 8
    and replace(o.id::text, '-', '') like left(q.code, 32) || '%'
    and (
      (q.contact <> '' and lower(o.customer_email) = q.contact)
      or (length(q.digits) >= 8 and right(regexp_replace(coalesce(o.customer_phone, ''), '[^0-9]', '', 'g'), 10) = right(q.digits, 10))
    )
  order by o.created_at desc
  limit 1;
$$;

revoke all on function public.find_order_public(text, text) from public;
grant execute on function public.find_order_public(text, text) to anon, authenticated;

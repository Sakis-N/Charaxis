-- Εκτιμώμενος χρόνος παραγωγής ανά παραγγελία (τον ορίζεις από το admin).
alter table public.orders add column if not exists production_time text;

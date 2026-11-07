# Charaxis — eshop

Next.js (App Router) + Tailwind CSS + Supabase. Custom laser χαράξεις σε ξύλο.

## Τοπική ανάπτυξη

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Στοίβα

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** για styling
- **Supabase** για βάση δεδομένων, auth και storage εικόνων
- **Netlify** για hosting — auto-deploy σε κάθε push στο `main`

## Δομή

- `app/` — σελίδες (App Router)
- `components/` — React components
- `lib/supabase/` — Supabase client

## Κατάσταση

Αρχικό scaffold: αρχική σελίδα με στατικό περιεχόμενο/placeholders.
Επόμενα βήματα: data model στο Supabase (products, categories, orders,
coupons), σελίδα προϊόντος, custom builder για το μπρελόκ, καλάθι/checkout.

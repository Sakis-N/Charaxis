import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Λείπουν τα NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
      "Αντίγραψε το .env.example σε .env.local (ή βάλτα στο Netlify dashboard)."
  );
}

// Client-side Supabase client — χρησιμοποιεί το publishable (anon) key,
// ασφαλές να εκτίθεται στον browser. Η πρόσβαση στα δεδομένα ελέγχεται
// από Row Level Security (RLS) policies μέσα στη βάση.
export const supabase = createClient(supabaseUrl, supabaseKey);

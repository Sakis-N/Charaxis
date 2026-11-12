// Server-only βοηθοί για το Supabase REST API (χωρίς npm πακέτα).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasService = Boolean(url && service);

export async function sbService(path: string, init: RequestInit = {}) {
  if (!url || !service) throw new Error("service role not configured");
  return fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: service,
      // Τα νέα κλειδιά (sb_secret_…) δεν είναι JWT· στέλνονται μόνο ως apikey.
      ...(service.startsWith("eyJ") ? { Authorization: `Bearer ${service}` } : {}),
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

// Ελέγχει αν ο bearer token ανήκει σε διαχειριστή (RPC is_admin με το token του χρήστη).
export async function isAdminToken(token: string | null): Promise<boolean> {
  if (!url || !anon || !token) return false;
  const r = await fetch(`${url}/rest/v1/rpc/is_admin`, {
    method: "POST",
    headers: { apikey: anon, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!r.ok) return false;
  return (await r.json()) === true;
}

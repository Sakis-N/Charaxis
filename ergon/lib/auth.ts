// Works in both Edge (middleware) and Node runtimes via Web Crypto.
export const COOKIE = "ergon_session";
const MAX_AGE_DAYS = 60;

function secret() {
  return process.env.SESSION_SECRET || "ergon-dev-secret-change-me";
}

async function hmac(data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSessionValue(): Promise<string> {
  const exp = Date.now() + MAX_AGE_DAYS * 864e5;
  return `${exp}.${await hmac(String(exp))}`;
}

export async function verifySessionValue(v?: string | null): Promise<boolean> {
  if (!v) return false;
  const [exp, sig] = v.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return (await hmac(exp)) === sig;
}

export const SESSION_MAX_AGE = MAX_AGE_DAYS * 86400;

export function checkPassword(p: string): boolean {
  const expected = process.env.APP_PASSWORD || "ergon";
  return p === expected;
}

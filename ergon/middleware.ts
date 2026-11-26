import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verifySessionValue } from "@/lib/auth";

// Endpoints the phone can call with ?key=API_TOKEN instead of a session
const TOKEN_PATHS = ["/api/lookup", "/api/contacts.vcf", "/api/calendar.ics"];

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname);
  const pass = () => NextResponse.next({ request: { headers } });
  if (pathname === "/login" || pathname.startsWith("/_next") || pathname === "/manifest.webmanifest" || pathname.startsWith("/icon")) {
    return pass();
  }
  if (TOKEN_PATHS.includes(pathname)) {
    const token = process.env.API_TOKEN;
    const key = searchParams.get("key") || req.headers.get("x-api-key");
    if (token && key === token) return pass();
  }
  if (await verifySessionValue(req.cookies.get(COOKIE)?.value)) return pass();
  if (pathname.startsWith("/api/")) return new NextResponse("Unauthorized", { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };

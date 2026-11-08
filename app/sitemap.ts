import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed = ["", "/proionta", "/prosfora", "/epikoinonia", "/faq", "/apostoli-pliromi", "/epistrofes", "/oroi-xrhshs", "/aporrito"].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: new Date(),
  }));
  let dynamic: MetadataRoute.Sitemap = [];
  try {
    const [{ data: products }, { data: cats }] = await Promise.all([
      supabase.from("products").select("slug, updated_at").eq("active", true),
      supabase.from("categories").select("slug").eq("active", true),
    ]);
    dynamic = [
      ...(products ?? []).map((p) => ({ url: `${SITE_URL}/proionta/${p.slug}`, lastModified: new Date(p.updated_at) })),
      ...(cats ?? []).map((c) => ({ url: `${SITE_URL}/kategories/${c.slug}`, lastModified: new Date() })),
    ];
  } catch {}
  return [...fixed, ...dynamic];
}

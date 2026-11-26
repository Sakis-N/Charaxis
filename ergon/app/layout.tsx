import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { Sidebar, TopBar } from "@/components/Nav";
import { getSetting } from "@/lib/db";

export const metadata: Metadata = {
  title: "Ergon — Διαχείριση εργασιών",
  description: "Πελάτες, εγκαταστάσεις, εργασίες, ραντεβού",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Ergon", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1f63c8" };
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const path = headers().get("x-pathname") || "";
  const bare = path === "/login" || path.endsWith("/print");
  return (
    <html lang="el">
      <body>
        {bare ? (
          children
        ) : (
          <>
            <Sidebar business={getSetting("business_name", "Η επιχείρησή μου")} />
            <div className="lg:pl-60">
              <TopBar />
              <main className="mx-auto max-w-7xl px-4 pb-24 pt-5 lg:px-6 lg:pb-10">{children}</main>
            </div>
          </>
        )}
      </body>
    </html>
  );
}

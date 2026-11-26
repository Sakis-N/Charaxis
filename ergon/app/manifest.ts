import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ergon — Διαχείριση εργασιών",
    short_name: "Ergon",
    start_url: "/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#1f63c8",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}

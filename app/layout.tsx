import type { Metadata } from "next";
import { Bricolage_Grotesque, Source_Serif_4 } from "next/font/google";
import "./globals.css";

// Bricolage Grotesque — τίτλοι, navigation, τιμές, κουμπιά: η "μηχανική"
// ακρίβεια του λέιζερ.
const display = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext", "greek"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

// Source Serif 4 — μόνο για κυρίως κείμενο/περιγραφές: η ζεστασιά του
// χειροποίητου.
const serif = Source_Serif_4({
  subsets: ["latin", "latin-ext", "greek"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Charaxis — Χειροποίητες Laser Χαράξεις",
  description:
    "Προσωποποιημένα ξύλινα μπρελόκ, χαραγμένες φωτογραφίες και χριστουγεννιάτικα στολίδια, χαραγμένα σε ξύλο.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="el" className={`${display.variable} ${serif.variable}`}>
      <body className="bg-paper font-display text-ink antialiased">
        {children}
      </body>
    </html>
  );
}

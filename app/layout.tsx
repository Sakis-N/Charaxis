import type { Metadata } from "next";
import { Bricolage_Grotesque, Source_Serif_4 } from "next/font/google";
import "./globals.css";

// Bricolage Grotesque — τίτλοι, navigation, τιμές, κουμπιά: η "μηχανική"
// ακρίβεια του λέιζερ. Variable font — δεν ορίζουμε discrete weights,
// ώστε να φορτώνει κανονικά ως variable instance.
const display = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext", "greek"],
  variable: "--font-display",
  display: "swap",
});

// Source Serif 4 — μόνο για κυρίως κείμενο/περιγραφές: η ζεστασιά του
// χειροποίητου. Variable font, ίδιος λόγος.
const serif = Source_Serif_4({
  subsets: ["latin", "latin-ext", "greek"],
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

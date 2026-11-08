import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import QuoteForm from "@/components/QuoteForm";

export const metadata: Metadata = {
  title: "Ζήτα Προσφορά — Charaxis",
  description: "Ρολόγια, επιγραφές, φωτιστικά, χάραξη σε μαχαίρια και ό,τι άλλο φανταστείς. Πες μας την ιδέα σου και θα σου στείλουμε προσφορά.",
};

export default function QuotePage() {
  return (
    <PageShell
      title="Ζήτα προσφορά"
      intro="Ρολόγια, επιγραφές, φωτιστικά, χάραξη σε μαχαίρια, δώρα για την εταιρεία σου — ό,τι δεν βρίσκεις έτοιμο στο κατάστημα. Περίγραψέ μας την ιδέα σου και θα σου απαντήσουμε με τιμή και χρόνο παράδοσης."
    >
      <QuoteForm />
    </PageShell>
  );
}

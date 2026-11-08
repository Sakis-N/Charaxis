import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import ContactForm from "@/components/ContactForm";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Επικοινωνία — Charaxis",
  description: "Στείλε μας μήνυμα για οποιαδήποτε απορία σχετικά με παραγγελίες και χαράξεις.",
};

export default function ContactPage() {
  return (
    <PageShell title="Επικοινωνία" intro="Έχεις απορία για μια παραγγελία ή για το τι μπορούμε να χαράξουμε; Γράψε μας.">
      <div className="flex flex-col gap-1 font-display text-[15px]">
        <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
        {BUSINESS.phone && <a href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`}>{BUSINESS.phone}</a>}
        {BUSINESS.instagram && <a href={BUSINESS.instagram} target="_blank" rel="noreferrer">Instagram</a>}
        {BUSINESS.facebook && <a href={BUSINESS.facebook} target="_blank" rel="noreferrer">Facebook</a>}
      </div>
      <ContactForm />
    </PageShell>
  );
}

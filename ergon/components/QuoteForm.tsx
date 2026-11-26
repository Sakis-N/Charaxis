import { Card, Textarea } from "./ui";
import { QuoteItemsEditor, SubmitButton } from "./client";
import { QuoteMetaFields } from "./forms";
import { saveQuote } from "@/app/actions";
import type { Row } from "@/lib/db";

export function QuoteForm({ q, items, o, defaults, terms }: { q?: Row; items: Row[]; o: any; defaults?: Row; terms: string }) {
  return (
    <form action={saveQuote} className="space-y-5">
      <Card title="Στοιχεία">
        <QuoteMetaFields q={q} o={o} defaults={defaults} />
      </Card>
      <Card title="Είδη / εργασίες">
        <QuoteItemsEditor items={items as any} />
      </Card>
      <Card title="Σημειώσεις & όροι">
        <div className="grid gap-4 sm:grid-cols-2">
          <Textarea label="Σημειώσεις (εμφανίζονται στην προσφορά)" name="notes" defaultValue={q?.notes ?? ""} rows={4} />
          <Textarea label="Όροι" name="terms" defaultValue={q?.terms ?? terms} rows={4} />
        </div>
      </Card>
      <SubmitButton>Αποθήκευση προσφοράς</SubmitButton>
    </form>
  );
}

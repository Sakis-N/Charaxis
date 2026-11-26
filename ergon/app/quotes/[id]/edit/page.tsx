import { notFound } from "next/navigation";
import { all, get, getSetting } from "@/lib/db";
import { selectOptions } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { QuoteForm } from "@/components/QuoteForm";
import { ConfirmForm } from "@/components/client";
import { deleteQuote } from "../../../actions";

export default function EditQuote({ params }: { params: { id: string } }) {
  const q = get("SELECT * FROM quotes WHERE id=?", Number(params.id));
  if (!q) notFound();
  const items = all("SELECT * FROM quote_items WHERE quote_id=? ORDER BY position", q.id);
  return (
    <>
      <PageHeader title={`Επεξεργασία προσφοράς ${q.number}`} back={{ href: `/quotes/${q.id}`, label: "Προσφορά" }} />
      <QuoteForm q={q} items={items} o={selectOptions()} terms={getSetting("quote_terms")} />
      <div className="mt-6">
        <ConfirmForm action={deleteQuote} message="Διαγραφή προσφοράς;">
          <input type="hidden" name="id" value={q.id} />
          <button className="text-sm text-red-600 hover:underline">🗑 Διαγραφή προσφοράς</button>
        </ConfirmForm>
      </div>
    </>
  );
}

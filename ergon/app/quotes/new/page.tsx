import { getSetting } from "@/lib/db";
import { selectOptions } from "@/lib/data";
import { addDays, today } from "@/lib/util";
import { PageHeader } from "@/components/ui";
import { QuoteForm } from "@/components/QuoteForm";

export default function NewQuote({ searchParams }: { searchParams: { customer?: string; installation?: string } }) {
  return (
    <>
      <PageHeader title="Νέα προσφορά" back={{ href: "/quotes", label: "Προσφορές" }} />
      <QuoteForm
        o={selectOptions()}
        items={[]}
        terms={getSetting("quote_terms")}
        defaults={{
          customer_id: searchParams.customer ? Number(searchParams.customer) : undefined,
          installation_id: searchParams.installation ? Number(searchParams.installation) : undefined,
          issue_date: today(),
          valid_until: addDays(today(), 30),
          vat_rate: Number(getSetting("default_vat", "24")),
        }}
      />
    </>
  );
}

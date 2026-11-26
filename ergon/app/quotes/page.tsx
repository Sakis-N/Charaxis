import Link from "next/link";
import { all } from "@/lib/db";
import { quoteTotals } from "@/lib/data";
import { QUOTE_STATUS, fmtDate, money, today } from "@/lib/util";
import { Badge, Card, Empty, LinkButton, PageHeader, Table, Td } from "@/components/ui";

export default function Quotes({ searchParams }: { searchParams: { status?: string } }) {
  const st = searchParams.status;
  const rows = all(
    `SELECT q.*, c.name customer_name FROM quotes q JOIN customers c ON c.id=q.customer_id ${st ? "WHERE q.status=?" : ""} ORDER BY q.created_at DESC`,
    ...(st ? [st] : []),
  ).map((q) => ({ ...q, totals: quoteTotals(q.id) }));
  const t = today();
  return (
    <>
      <PageHeader title="Προσφορές" subtitle={`${rows.length} προσφορές`} actions={<LinkButton href="/quotes/new" variant="primary">+ Νέα προσφορά</LinkButton>} />
      <div className="mb-3 flex flex-wrap gap-1.5">
        <Link href="/quotes"><Badge cls={!st ? "bg-brand-600 text-white" : "bg-white border border-gray-200"}>Όλες</Badge></Link>
        {Object.entries(QUOTE_STATUS).map(([k, v]) => (
          <Link key={k} href={`/quotes?status=${k}`}><Badge cls={st === k ? "bg-brand-600 text-white" : "bg-white border border-gray-200"}>{v.label}</Badge></Link>
        ))}
      </div>
      <Card>
        {rows.length ? (
          <Table head={["Αρ.", "Πελάτης / Τίτλος", "Ημ/νία", "Ισχύς", "Σύνολο", "Κατάσταση"]}>
            {rows.map((q) => (
              <tr key={q.id} className="hover:bg-gray-50">
                <Td className="font-mono text-xs">{q.number}</Td>
                <Td>
                  <Link href={`/quotes/${q.id}`} className="font-medium text-brand-700 hover:underline">{q.title}</Link>
                  <div className="text-xs text-gray-500">{q.customer_name}</div>
                </Td>
                <Td>{fmtDate(q.issue_date)}</Td>
                <Td className={q.valid_until && q.valid_until < t && q.status === "sent" ? "text-red-600" : ""}>{fmtDate(q.valid_until)}</Td>
                <Td className="font-medium">{money(q.totals.total)}</Td>
                <Td><Badge cls={QUOTE_STATUS[q.status]?.cls}>{QUOTE_STATUS[q.status]?.label}</Badge></Td>
              </tr>
            ))}
          </Table>
        ) : <Empty>Καμία προσφορά.</Empty>}
      </Card>
    </>
  );
}

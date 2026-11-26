import Link from "next/link";
import { all, get } from "@/lib/db";
import { selectOptions, syncContracts } from "@/lib/data";
import { addDays, fmtDate, money, today } from "@/lib/util";
import { Badge, Card, Empty, LinkButton, PageHeader, Table, Td, btn } from "@/components/ui";
import { ConfirmForm } from "@/components/client";
import { ContractForm } from "@/components/forms";
import { deleteContract, saveContract, skipContractVisit } from "../actions";

export default function Contracts({ searchParams }: { searchParams: { new?: string; edit?: string; customer?: string } }) {
  syncContracts();
  const rows = all(
    `SELECT k.*, c.name customer_name, i.name installation_name, t.name tech_name,
       (SELECT COUNT(*) FROM jobs j WHERE j.contract_id=k.id AND j.status='done') done_visits,
       (SELECT MIN(substr(scheduled_at,1,10)) FROM jobs j WHERE j.contract_id=k.id AND j.status IN ('scheduled','pending')) planned
     FROM contracts k JOIN customers c ON c.id=k.customer_id
     LEFT JOIN installations i ON i.id=k.installation_id LEFT JOIN technicians t ON t.id=k.technician_id
     ORDER BY k.active DESC, k.next_date`,
  );
  const editing = searchParams.edit ? get("SELECT * FROM contracts WHERE id=?", Number(searchParams.edit)) : undefined;
  const showForm = !!searchParams.new || !!editing;
  const t = today();
  const yearly = rows.filter((r) => r.active).reduce((s, r) => s + (r.annual_fee || (r.price * 12) / Math.max(1, r.interval_months)), 0);
  return (
    <>
      <PageHeader
        title="Συμβόλαια & επαναλαμβανόμενες συντηρήσεις"
        subtitle={`Οι επισκέψεις δημιουργούνται αυτόματα ως εργασίες 45 ημέρες πριν. Εκτιμώμενα ετήσια έσοδα: ${money(yearly)}`}
        actions={!showForm && <LinkButton href="/contracts?new=1" variant="primary">+ Νέο συμβόλαιο</LinkButton>}
      />
      {showForm && (
        <Card title={editing ? `Επεξεργασία: ${editing.title}` : "Νέο συμβόλαιο συντήρησης"} className="mb-5" actions={<LinkButton href="/contracts">Κλείσιμο</LinkButton>}>
          <ContractForm c={editing} o={selectOptions()} defaults={{ customer_id: searchParams.customer ? Number(searchParams.customer) : undefined, next_date: addDays(t, 7) }} action={saveContract} />
          {editing && (
            <div className="mt-4 border-t pt-3">
              <ConfirmForm action={deleteContract} message="Διαγραφή συμβολαίου; (οι εργασίες που έχουν δημιουργηθεί μένουν)">
                <input type="hidden" name="id" value={editing.id} />
                <button className="text-sm text-red-600 hover:underline">🗑 Διαγραφή συμβολαίου</button>
              </ConfirmForm>
            </div>
          )}
        </Card>
      )}
      <Card>
        {rows.length ? (
          <Table head={["Συμβόλαιο", "Πελάτης", "Συχνότητα", "Επόμενη", "Τεχνικός", "Χρέωση", ""]}>
            {rows.map((k) => (
              <tr key={k.id} className={k.active ? "" : "opacity-50"}>
                <Td>
                  <Link href={`/contracts?edit=${k.id}`} className="font-medium text-brand-700 hover:underline">🔁 {k.title}</Link>
                  <div className="text-xs text-gray-500">{k.done_visits} επισκέψεις έγιναν{k.end_date ? ` · λήξη ${fmtDate(k.end_date)}` : ""}</div>
                </Td>
                <Td>
                  <Link href={`/customers/${k.customer_id}`} className="hover:underline">{k.customer_name}</Link>
                  {k.installation_name && <div className="text-xs text-gray-500">{k.installation_name}</div>}
                </Td>
                <Td>κάθε {k.interval_months} μήν.</Td>
                <Td>
                  {k.planned ? <Badge cls="bg-blue-100 text-blue-800">προγρ. {fmtDate(k.planned)}</Badge> : null}
                  <div className="text-xs text-gray-500">μετά: {fmtDate(k.next_date)}</div>
                </Td>
                <Td>{k.tech_name || "—"}</Td>
                <Td>{money(k.price)}</Td>
                <Td>
                  {k.active ? (
                    <form action={skipContractVisit}>
                      <input type="hidden" name="id" value={k.id} />
                      <button className={btn.small} title="Μεταφορά της επόμενης αυτόματης επίσκεψης έναν κύκλο μετά">⏭ Παράλειψη</button>
                    </form>
                  ) : <Badge>ανενεργό</Badge>}
                </Td>
              </tr>
            ))}
          </Table>
        ) : <Empty>Κανένα συμβόλαιο. Πρόσθεσε ετήσιες/εξαμηνιαίες συντηρήσεις και η εφαρμογή θα τις προγραμματίζει μόνη της.</Empty>}
      </Card>
    </>
  );
}

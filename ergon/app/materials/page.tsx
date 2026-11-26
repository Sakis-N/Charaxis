import Link from "next/link";
import { all, get } from "@/lib/db";
import { money, num } from "@/lib/util";
import { Card, Empty, Input, LinkButton, PageHeader, Table, Td, inputCls } from "@/components/ui";
import { ConfirmForm, SubmitButton } from "@/components/client";
import { deleteMaterial, saveMaterial } from "../actions";

export default function Materials({ searchParams }: { searchParams: { q?: string; e?: string } }) {
  const q = searchParams.q || "";
  const rows = all(
    `SELECT m.*, (SELECT COALESCE(SUM(qty),0) FROM job_materials jm WHERE jm.material_id=m.id) used FROM materials m
     WHERE ?='' OR m.name LIKE ? OR m.code LIKE ? ORDER BY m.name COLLATE NOCASE`,
    q, `%${q}%`, `%${q}%`,
  );
  const e = searchParams.e ? get("SELECT * FROM materials WHERE id=?", Number(searchParams.e)) : undefined;
  const stockValue = rows.reduce((s, r) => s + Math.max(0, r.stock) * r.unit_cost, 0);
  return (
    <>
      <PageHeader title="Υλικά & αποθήκη" subtitle={`${rows.length} είδη · αξία αποθήκης (κόστος) ${money(stockValue)}`} />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <form className="mb-3 flex gap-2">
            <input name="q" defaultValue={q} placeholder="Αναζήτηση υλικού ή κωδικού…" className={inputCls} />
            <button className="rounded-lg bg-gray-800 px-4 text-sm text-white">OK</button>
          </form>
          {rows.length ? (
            <Table head={["Υλικό", "Απόθεμα", "Κόστος", "Τιμή", "Περιθ.", "Χρήση", ""]}>
              {rows.map((m) => (
                <tr key={m.id}>
                  <Td><b>{m.name}</b>{m.code && <div className="font-mono text-xs text-gray-500">{m.code}</div>}</Td>
                  <Td className={m.stock <= 0 ? "font-medium text-red-600" : ""}>{num(m.stock)} {m.unit}</Td>
                  <Td>{money(m.unit_cost)}</Td>
                  <Td>{money(m.unit_price)}</Td>
                  <Td className="text-xs text-gray-500">{m.unit_cost > 0 ? `${Math.round(((m.unit_price - m.unit_cost) / m.unit_cost) * 100)}%` : "—"}</Td>
                  <Td className="text-xs">{num(m.used)}</Td>
                  <Td><Link href={`/materials?e=${m.id}`} className="text-xs text-brand-600">✏️</Link></Td>
                </tr>
              ))}
            </Table>
          ) : <Empty>Δεν υπάρχουν υλικά. Πρόσθεσε τα συχνά υλικά σου για γρήγορη χρέωση σε εργασίες.</Empty>}
        </Card>
        <Card title={e ? `Επεξεργασία: ${e.name}` : "Νέο υλικό"} actions={e && <LinkButton href="/materials">Άκυρο</LinkButton>}>
          <form action={saveMaterial} className="grid gap-3" key={e?.id ?? "n"}>
            {e && <input type="hidden" name="id" value={e.id} />}
            <Input label="Όνομα *" name="name" required defaultValue={e?.name} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Κωδικός" name="code" defaultValue={e?.code ?? ""} />
              <Input label="Μονάδα" name="unit" defaultValue={e?.unit ?? "τεμ"} list="units" />
              <datalist id="units">{["τεμ", "μ", "μ²", "kg", "lt", "σετ", "ώρα", "κουτί"].map((u) => <option key={u} value={u} />)}</datalist>
              <Input label="Κόστος αγοράς €" name="unit_cost" inputMode="decimal" defaultValue={e?.unit_cost ?? ""} />
              <Input label="Τιμή πώλησης €" name="unit_price" inputMode="decimal" defaultValue={e?.unit_price ?? ""} />
              <Input label="Απόθεμα" name="stock" inputMode="decimal" defaultValue={e?.stock ?? 0} />
            </div>
            <Input label="Σημειώσεις / προμηθευτής" name="notes" defaultValue={e?.notes ?? ""} />
            <div className="flex items-center gap-3">
              <SubmitButton>Αποθήκευση</SubmitButton>
              {e && (
                <ConfirmForm action={deleteMaterial} message="Διαγραφή υλικού;">
                  <input type="hidden" name="id" value={e.id} />
                  <button className="text-sm text-red-600">Διαγραφή</button>
                </ConfirmForm>
              )}
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}

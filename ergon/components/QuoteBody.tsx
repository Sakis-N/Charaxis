import { all, get } from "@/lib/db";
import { quoteTotals } from "@/lib/data";
import { money, num } from "@/lib/util";

export function QuoteBody({ id }: { id: number }) {
  const q = get("SELECT * FROM quotes WHERE id=?", id)!;
  const items = all("SELECT * FROM quote_items WHERE quote_id=? ORDER BY position", id);
  const t = quoteTotals(id);
  return (
    <>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-gray-800 text-left">
            <th className="py-1.5 pr-2">#</th>
            <th className="py-1.5">Περιγραφή</th>
            <th className="py-1.5 text-right">Ποσότητα</th>
            <th className="py-1.5 text-right">Τιμή μον.</th>
            <th className="py-1.5 text-right">Σύνολο</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={it.id} className="border-b border-gray-200">
              <td className="py-1.5 pr-2 text-gray-500">{i + 1}</td>
              <td className="whitespace-pre-wrap py-1.5">{it.description}</td>
              <td className="py-1.5 text-right">{num(it.qty)} {it.unit}</td>
              <td className="py-1.5 text-right">{money(it.unit_price)}</td>
              <td className="py-1.5 text-right">{money(it.qty * it.unit_price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ml-auto mt-3 w-full max-w-xs space-y-1 text-sm">
        <div className="flex justify-between"><span>Μερικό σύνολο</span><span>{money(t.sub)}</span></div>
        {t.discount > 0 && <div className="flex justify-between"><span>Έκπτωση</span><span>−{money(t.discount)}</span></div>}
        <div className="flex justify-between"><span>Καθαρή αξία</span><span>{money(t.net)}</span></div>
        <div className="flex justify-between"><span>ΦΠΑ {num(q.vat_rate)}%</span><span>{money(t.vat)}</span></div>
        <div className="flex justify-between border-t-2 border-gray-800 pt-1 text-base font-bold"><span>Σύνολο</span><span>{money(t.total)}</span></div>
      </div>
    </>
  );
}

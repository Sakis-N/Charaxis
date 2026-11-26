import Link from "next/link";
import { all } from "@/lib/db";
import { callerInfo } from "@/lib/lookup";
import { fmtDateTime, money, telHref } from "@/lib/util";
import { Card, Empty, LinkButton, PageHeader, inputCls } from "@/components/ui";

/** Οθόνη εισερχόμενης κλήσης: /calls?phone=69... — ανοίγει από αυτοματισμό του κινητού */
export default function Calls({ searchParams }: { searchParams: { phone?: string } }) {
  const phone = (searchParams.phone || "").trim();
  const info = phone ? callerInfo(phone, true) : null;
  const recent = all("SELECT k.*, c.name customer_name FROM calls k LEFT JOIN customers c ON c.id=k.customer_id ORDER BY k.id DESC LIMIT 40");
  return (
    <>
      <PageHeader title="Κλήσεις & αναγνώριση πελάτη" subtitle="Πληκτρολόγησε έναν αριθμό ή άνοιξε αυτή τη σελίδα αυτόματα από το κινητό σε κάθε εισερχόμενη κλήση" />
      <form className="mb-5 flex gap-2">
        <input name="phone" type="tel" defaultValue={phone} placeholder="Αριθμός τηλεφώνου" className={`${inputCls} max-w-xs text-lg`} autoFocus={!phone} />
        <button className="rounded-lg bg-brand-600 px-4 text-sm text-white">Ποιος είναι;</button>
      </form>
      {info && (
        info.found ? (
          <Card className="mb-5 border-green-300 bg-green-50">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase text-green-700">Γνωστός πελάτης</div>
                <Link href={`/customers/${info.customer.id}`} className="text-2xl font-bold text-gray-900 hover:underline">{info.customer.name}</Link>
                {info.customer.company && <div className="text-gray-600">{info.customer.company}</div>}
                <div className="mt-2 space-y-0.5 text-sm">
                  {info.installations.length > 0 && <div>🏢 {info.installations.map((i: any) => [i.name, i.city].filter(Boolean).join(" ")).join(" · ")}</div>}
                  {info.next && <div>📅 Επόμενο: <Link href={`/jobs/${info.next.id}`} className="underline">{fmtDateTime(info.next.scheduled_at)} — {info.next.title}</Link></div>}
                  {info.last && <div>✓ Τελευταίο: <Link href={`/jobs/${info.last.id}`} className="underline">{fmtDateTime(info.last.scheduled_at)} — {info.last.title}</Link></div>}
                  {Math.abs(info.balance) > 0.005 && <div className="font-semibold text-amber-700">💶 Υπόλοιπο: {money(info.balance)}</div>}
                  {info.customer.notes && <div className="mt-1 whitespace-pre-wrap rounded bg-yellow-50 p-2">{info.customer.notes}</div>}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <LinkButton href={`/jobs/new?customer=${info.customer.id}`} variant="primary">+ Νέα εργασία</LinkButton>
                <LinkButton href={`/customers/${info.customer.id}`}>Καρτέλα πελάτη</LinkButton>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="mb-5 border-amber-300 bg-amber-50">
            <div className="text-lg font-semibold">Άγνωστος αριθμός: {phone}</div>
            <div className="mt-2 flex gap-2">
              <LinkButton href={`/customers/new?phone=${encodeURIComponent(phone)}`} variant="primary">+ Νέος πελάτης</LinkButton>
              <a href={telHref(phone)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">📞 Κλήση</a>
            </div>
          </Card>
        )
      )}
      <Card title="Πρόσφατες κλήσεις">
        {recent.length ? (
          <ul className="divide-y divide-gray-100 text-sm">
            {recent.map((k) => (
              <li key={k.id} className="flex items-center justify-between gap-2 py-2">
                <span>{k.customer_name ? <Link href={`/customers/${k.customer_id}`} className="font-medium text-brand-700 hover:underline">{k.customer_name}</Link> : <Link href={`/customers/new?phone=${encodeURIComponent(k.phone)}`} className="text-gray-600 hover:underline">{k.phone} (άγνωστος)</Link>}</span>
                <span className="text-xs text-gray-500">{fmtDateTime(k.created_at.replace(" ", "T"))}</span>
              </li>
            ))}
          </ul>
        ) : <Empty>Καμία κλήση. Δες τις Ρυθμίσεις → «Κινητό» για αυτόματη αναγνώριση.</Empty>}
      </Card>
    </>
  );
}

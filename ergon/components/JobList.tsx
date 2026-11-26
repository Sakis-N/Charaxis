import Link from "next/link";
import { Badge, Dot, Empty } from "./ui";
import { JOB_STATUS, PRIORITY, fmtDateTime, money } from "@/lib/util";
import type { Row } from "@/lib/db";

/** Compact list of jobs used across pages. Expects rows from JOB_LIST_SQL. */
export function JobList({ jobs, empty = "Καμία εργασία.", showCustomer = true }: { jobs: Row[]; empty?: string; showCustomer?: boolean }) {
  if (!jobs.length) return <Empty>{empty}</Empty>;
  return (
    <ul className="divide-y divide-gray-100">
      {jobs.map((j) => (
        <li key={j.id}>
          <Link href={`/jobs/${j.id}`} className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-gray-50">
            <div className="w-24 shrink-0 text-xs text-gray-500">{j.scheduled_at ? fmtDateTime(j.scheduled_at) : <span className="italic">χωρίς ημ/νία</span>}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-900">{j.title}</span>
                <Badge cls={JOB_STATUS[j.status]?.cls}>{JOB_STATUS[j.status]?.label}</Badge>
                {j.priority !== "normal" && <Badge cls={PRIORITY[j.priority]?.cls}>{PRIORITY[j.priority]?.label}</Badge>}
                {j.contract_id && <Badge cls="bg-teal-100 text-teal-800">🔁 συμβόλαιο</Badge>}
              </div>
              <div className="mt-0.5 truncate text-xs text-gray-500">
                {showCustomer && j.customer_name}
                {j.installation_name ? ` · ${j.installation_name}` : ""}
                {j.city ? ` · ${j.city}` : ""}
              </div>
            </div>
            <div className="hidden shrink-0 text-right text-xs sm:block">
              {(j.technician_name || j.crew_name) && (
                <div className="flex items-center justify-end gap-1.5 text-gray-600">
                  <Dot color={j.technician_color || j.crew_color} />
                  {j.technician_name || j.crew_name}
                </div>
              )}
              {j.total > 0 && <div className="text-gray-500">{money(j.total)}</div>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

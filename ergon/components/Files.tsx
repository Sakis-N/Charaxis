import { Card, Empty, btn, inputCls } from "./ui";
import { ConfirmForm, SubmitButton } from "./client";
import { removeFile, uploadFiles } from "@/app/actions";
import { fmtDateTime, fmtSize } from "@/lib/util";
import type { Row } from "@/lib/db";

export function FilesCard({
  files,
  owner,
  back,
  error,
  usage,
  title = "Φωτογραφίες & αρχεία",
}: {
  files: Row[];
  owner: { customer_id?: number | null; installation_id?: number | null; job_id?: number | null };
  back: string;
  error?: string;
  usage?: { used: number; limit: number };
  title?: string;
}) {
  const images = files.filter((f) => String(f.mime).startsWith("image/"));
  const docs = files.filter((f) => !String(f.mime).startsWith("image/"));
  return (
    <Card
      title={title}
      actions={usage && <span className="text-xs text-gray-500">{fmtSize(usage.used)} / {fmtSize(usage.limit)}</span>}
    >
      {usage && (
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded bg-gray-100">
          <div className={`h-full ${usage.used / usage.limit > 0.9 ? "bg-red-500" : "bg-brand-500"}`} style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }} />
        </div>
      )}
      <form action={uploadFiles} className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
        {owner.customer_id && <input type="hidden" name="customer_id" value={owner.customer_id} />}
        {owner.installation_id && <input type="hidden" name="installation_id" value={owner.installation_id} />}
        {owner.job_id && <input type="hidden" name="job_id" value={owner.job_id} />}
        <input type="hidden" name="_back" value={back} />
        <input type="file" name="files" multiple accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.dwg,.txt,.zip" capture={undefined} className="min-w-0 flex-1 text-sm file:mr-2 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-brand-700" />
        <input name="caption" placeholder="Λεζάντα (προαιρ.)" className={`${inputCls} w-full sm:w-48`} />
        <SubmitButton>⬆ Ανέβασμα</SubmitButton>
      </form>
      {error && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {!files.length && <Empty>Δεν υπάρχουν αρχεία. Από κινητό μπορείς να τραβήξεις φωτογραφία κατευθείαν.</Empty>}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {images.map((f) => (
            <div key={f.id} className="group relative">
              <a href={`/api/files/${f.id}`} target="_blank">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/files/${f.id}`} alt={f.filename} className="aspect-square w-full rounded-lg object-cover" loading="lazy" />
              </a>
              {f.caption && <div className="mt-0.5 truncate text-[11px] text-gray-600">{f.caption}</div>}
              <ConfirmForm action={removeFile} message="Διαγραφή αρχείου;" className="absolute right-1 top-1 hidden group-hover:block print:hidden">
                <input type="hidden" name="id" value={f.id} />
                <input type="hidden" name="_back" value={back} />
                <button className="rounded bg-white/90 px-1.5 text-xs text-red-600 shadow">✕</button>
              </ConfirmForm>
            </div>
          ))}
        </div>
      )}
      {docs.length > 0 && (
        <ul className="mt-3 divide-y divide-gray-100 text-sm">
          {docs.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-2 py-1.5">
              <a href={`/api/files/${f.id}`} target="_blank" className="min-w-0 truncate text-brand-700 hover:underline">
                📄 {f.filename}
                {f.caption ? ` — ${f.caption}` : ""}
              </a>
              <span className="flex shrink-0 items-center gap-2 text-xs text-gray-500">
                {fmtSize(f.size)} · {fmtDateTime(f.created_at)}
                <ConfirmForm action={removeFile} message="Διαγραφή αρχείου;">
                  <input type="hidden" name="id" value={f.id} />
                  <input type="hidden" name="_back" value={back} />
                  <button className="text-red-500 print:hidden">✕</button>
                </ConfirmForm>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export const _btn = btn;

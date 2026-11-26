import { notFound } from "next/navigation";
import { get } from "@/lib/db";
import { selectOptions } from "@/lib/data";
import { Card, PageHeader } from "@/components/ui";
import { ProjectForm } from "@/components/forms";
import { ConfirmForm } from "@/components/client";
import { deleteProject, saveProject } from "../../../actions";

export default function EditProject({ params }: { params: { id: string } }) {
  const p = get("SELECT * FROM projects WHERE id=?", Number(params.id));
  if (!p) notFound();
  return (
    <>
      <PageHeader title={`Επεξεργασία: ${p.name}`} back={{ href: `/projects/${p.id}`, label: p.name }} />
      <Card><ProjectForm p={p} o={selectOptions()} action={saveProject} /></Card>
      <div className="mt-6">
        <ConfirmForm action={deleteProject} message="Διαγραφή έργου; (οι εργασίες μένουν)">
          <input type="hidden" name="id" value={p.id} />
          <button className="text-sm text-red-600 hover:underline">🗑 Διαγραφή έργου</button>
        </ConfirmForm>
      </div>
    </>
  );
}

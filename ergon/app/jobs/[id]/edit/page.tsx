import { notFound } from "next/navigation";
import { get } from "@/lib/db";
import { selectOptions } from "@/lib/data";
import { jobTypes } from "@/lib/settings";
import { Card, PageHeader } from "@/components/ui";
import { JobForm } from "@/components/forms";
import { ConfirmForm } from "@/components/client";
import { deleteJob, saveJob } from "../../../actions";

export default function EditJob({ params }: { params: { id: string } }) {
  const j = get("SELECT * FROM jobs WHERE id=?", Number(params.id));
  if (!j) notFound();
  return (
    <>
      <PageHeader title={`Επεξεργασία: ${j.title}`} back={{ href: `/jobs/${j.id}`, label: "Εργασία" }} />
      <Card>
        <JobForm j={j} o={selectOptions()} jobTypes={jobTypes()} action={saveJob} />
      </Card>
      <div className="mt-6">
        <ConfirmForm action={deleteJob} message="Διαγραφή εργασίας με τα υλικά και τα αρχεία της;">
          <input type="hidden" name="id" value={j.id} />
          <button className="text-sm text-red-600 hover:underline">🗑 Διαγραφή εργασίας</button>
        </ConfirmForm>
      </div>
    </>
  );
}

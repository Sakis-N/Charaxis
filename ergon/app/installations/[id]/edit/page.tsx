import { notFound } from "next/navigation";
import { all, get } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { InstallationForm } from "@/components/forms";
import { ConfirmForm } from "@/components/client";
import { deleteInstallation, saveInstallation } from "../../../actions";

export default function EditInstallation({ params }: { params: { id: string } }) {
  const i = get("SELECT * FROM installations WHERE id=?", Number(params.id));
  if (!i) notFound();
  const customers = all("SELECT id, name FROM customers ORDER BY name COLLATE NOCASE");
  return (
    <>
      <PageHeader title={`Επεξεργασία: ${i.name}`} back={{ href: `/installations/${i.id}`, label: i.name }} />
      <Card>
        <InstallationForm i={i} customers={customers} action={saveInstallation} />
      </Card>
      <div className="mt-6">
        <ConfirmForm action={deleteInstallation} message="Διαγραφή εγκατάστασης, εξοπλισμού και αρχείων της; (οι εργασίες μένουν στον πελάτη)">
          <input type="hidden" name="id" value={i.id} />
          <button className="text-sm text-red-600 hover:underline">🗑 Διαγραφή εγκατάστασης</button>
        </ConfirmForm>
      </div>
    </>
  );
}

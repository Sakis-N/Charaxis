import { notFound } from "next/navigation";
import { get } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { CustomerForm } from "@/components/forms";
import { ConfirmForm } from "@/components/client";
import { deleteCustomer, saveCustomer } from "../../../actions";

export default function EditCustomer({ params }: { params: { id: string } }) {
  const c = get("SELECT * FROM customers WHERE id=?", Number(params.id));
  if (!c) notFound();
  return (
    <>
      <PageHeader title={`Επεξεργασία: ${c.name}`} back={{ href: `/customers/${c.id}`, label: c.name }} />
      <Card>
        <CustomerForm c={c} action={saveCustomer} />
      </Card>
      <div className="mt-6">
        <ConfirmForm action={deleteCustomer} message="Διαγραφή πελάτη ΜΑΖΙ με όλες τις εγκαταστάσεις, εργασίες, πληρωμές και αρχεία του;">
          <input type="hidden" name="id" value={c.id} />
          <button className="text-sm text-red-600 hover:underline">🗑 Διαγραφή πελάτη</button>
        </ConfirmForm>
      </div>
    </>
  );
}

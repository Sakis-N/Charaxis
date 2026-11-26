import { all } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { InstallationForm } from "@/components/forms";
import { saveInstallation } from "../../actions";

export default function NewInstallation({ searchParams }: { searchParams: { customer?: string } }) {
  const customers = all("SELECT id, name FROM customers ORDER BY name COLLATE NOCASE");
  const cid = searchParams.customer ? Number(searchParams.customer) : undefined;
  return (
    <>
      <PageHeader title="Νέα εγκατάσταση" back={cid ? { href: `/customers/${cid}`, label: "Πελάτης" } : { href: "/installations", label: "Εγκαταστάσεις" }} />
      <Card>
        <InstallationForm customers={customers} customerId={cid} action={saveInstallation} />
      </Card>
    </>
  );
}

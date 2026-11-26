import { Card, PageHeader } from "@/components/ui";
import { CustomerForm } from "@/components/forms";
import { saveCustomer } from "../../actions";

export default function NewCustomer({ searchParams }: { searchParams: { phone?: string } }) {
  return (
    <>
      <PageHeader title="Νέος πελάτης" back={{ href: "/customers", label: "Πελάτες" }} />
      <Card>
        <CustomerForm action={saveCustomer} c={searchParams.phone ? ({ phone: searchParams.phone } as any) : undefined} />
      </Card>
    </>
  );
}

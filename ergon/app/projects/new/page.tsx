import { selectOptions } from "@/lib/data";
import { today } from "@/lib/util";
import { Card, PageHeader } from "@/components/ui";
import { ProjectForm } from "@/components/forms";
import { saveProject } from "../../actions";

export default function NewProject({ searchParams }: { searchParams: { customer?: string } }) {
  return (
    <>
      <PageHeader title="Νέο έργο" back={{ href: "/projects", label: "Έργα" }} />
      <Card>
        <ProjectForm o={selectOptions()} defaults={{ customer_id: searchParams.customer ? Number(searchParams.customer) : undefined, start_date: today() }} action={saveProject} />
      </Card>
    </>
  );
}

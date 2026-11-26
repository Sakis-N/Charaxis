import { get } from "@/lib/db";
import { selectOptions } from "@/lib/data";
import { Card, PageHeader } from "@/components/ui";
import { JobForm } from "@/components/forms";
import { saveJob } from "../../actions";
import { jobTypes } from "@/lib/settings";

export default function NewJob({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const o = selectOptions();
  let customer = searchParams.customer ? Number(searchParams.customer) : undefined;
  const installation = searchParams.installation ? Number(searchParams.installation) : undefined;
  if (!customer && installation) customer = get("SELECT customer_id FROM installations WHERE id=?", installation)?.customer_id;
  const project = searchParams.project ? Number(searchParams.project) : undefined;
  if (!customer && project) customer = get("SELECT customer_id FROM projects WHERE id=?", project)?.customer_id;
  return (
    <>
      <PageHeader title="Νέα εργασία / ραντεβού" back={{ href: "/jobs", label: "Εργασίες" }} />
      <Card>
        <JobForm
          o={o}
          jobTypes={jobTypes()}
          defaults={{ customer_id: customer, installation_id: installation, project_id: project, date: searchParams.date, time: searchParams.time, technician_id: searchParams.tech ? Number(searchParams.tech) : undefined }}
          action={saveJob}
        />
      </Card>
    </>
  );
}

import { Student360DetailsPage } from "@/modules/students/components/student-360-details-page";

export default function Student360DetailsRoutePage({
  params,
}: {
  params: { id: string };
}) {
  return <Student360DetailsPage id={params.id} />;
}

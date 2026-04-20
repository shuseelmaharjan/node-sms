import { Student360DetailsPage } from "@/modules/students/components/student-360-details-page";

export async function generateStaticParams() {
  return [
    { id: "1" },
    { id: "2" },
    { id: "3" },
  ];
}

export default function Student360DetailsRoutePage({
  params,
}: {
  params: { id: string };
}) {
  return <Student360DetailsPage id={params.id} />;
}
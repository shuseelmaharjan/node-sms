import { Student360DetailsPage } from "@/modules/students/components/student-360-details-page";

type RouteParams = { id: string } | Promise<{ id: string }>;

export default async function Student360DetailsRoutePage({
  params,
}: {
  params: RouteParams;
}) {
  const { id } = await Promise.resolve(params);
  return <Student360DetailsPage id={id} />;
}

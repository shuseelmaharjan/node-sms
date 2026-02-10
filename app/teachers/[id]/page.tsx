import { TeacherDetailsPage } from "@/modules/teachers/components/teacher-details-page";

export default function TeacherDetailsRoutePage({
  params,
}: {
  params: { id: string };
}) {
  return <TeacherDetailsPage id={params.id} />;
}

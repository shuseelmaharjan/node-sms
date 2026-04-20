// teachers/[id]/page.tsx
import { TeacherDetailsPage } from "@/modules/teachers/components/teacher-details-page";

async function getTeachers() {
  return [
    { id: "1" },
    { id: "2" },
    { id: "3" },
  ];
}

export async function generateStaticParams() {
  const teachers = await getTeachers();

  return teachers.map((teacher) => ({
    id: teacher.id,
  }));
}

export default function TeacherDetailsRoutePage({
  params,
}: {
  params: { id: string };
}) {
  return <TeacherDetailsPage id={params.id} />;
}
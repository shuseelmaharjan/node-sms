import { SchoolEditPage } from "@/modules/admins/pages/edit/SchoolEditPage";

export default function Page({ params }: { params: { id: string } }) {
  return <SchoolEditPage id={params.id} />;
}

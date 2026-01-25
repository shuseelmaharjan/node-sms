import { AdminViewPage } from "@/modules/admins/pages/AdminViewPage";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <AdminViewPage id={id} />;
}
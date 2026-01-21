import { ClientEditPage } from "@/modules/admins/pages/edit/ClientEditPage";

export default function Page({ params }: { params: { id: string } }) {
  return <ClientEditPage id={params.id} />;
}

// "use client";

// import * as React from "react";
// import { useRouter } from "next/navigation";
// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// import { AdminStepShell } from "../../components/AdminStepShell";
// import { PersonalStep } from "../../components/steps/PersonalStep";
// import { fetchAdminDetail, updateAdminPersonal } from "../../api/admins.api";
// import { adminsKeys } from "../../admins.keys";

// export function PersonalEditPage({ id }: { id: string }) {
//   const router = useRouter();
//   const qc = useQueryClient();

//   const detailQuery = useQuery({
//     queryKey: adminsKeys.detail(id),
//     queryFn: () => fetchAdminDetail(id),
//   });

//   const userId = detailQuery.data?.id ?? null;
//   const firstSchool = detailQuery.data?.owned_schools?.[0];
//   const schoolId = firstSchool?.id ?? null;

//   const update = useMutation({
//     mutationFn: (values: any) => updateAdminPersonal(id, values),
//     onSuccess: async () => {
//       await qc.invalidateQueries({ queryKey: adminsKeys.detail(id) });
//       router.push(`/admins/${id}/edit/school`);
//     },
//   });

//   return (
//     <AdminStepShell
//       title="Edit Admin"
//       description="Step 1: Personal information"
//       mode="edit"
//       active="personal"
//       userId={userId}
//       schoolId={schoolId}
//       toPersonal={() => router.push(`/admins/${id}/edit/personal`)}
//       toSchool={() => router.push(`/admins/${id}/edit/school`)}
//       toClient={() => router.push(`/admins/${id}/edit/client`)}
//     >
//       <PersonalStep
//         mode="edit"
//         initial={detailQuery.data ?? null}
//         resetKey={`edit-personal-${id}-${detailQuery.data ? "ready" : "loading"}`}
//         submitLoading={update.isPending || detailQuery.isFetching}
//         onSubmit={async (values) => {
//           await update.mutateAsync(values);
//         }}
//       />
//     </AdminStepShell>
//   );
// }

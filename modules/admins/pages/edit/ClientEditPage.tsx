"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AdminStepShell } from "../../components/AdminStepShell";
import { ClientStep } from "../../components/steps/ClientStep";
import { fetchAdminDetail, updateAdminClient } from "../../api/admins.api";
import { adminsKeys } from "../../admins.keys";

export function ClientEditPage({ id }: { id: string }) {
  const router = useRouter();
  const qc = useQueryClient();

  const detailQuery = useQuery({
    queryKey: adminsKeys.detail(id),
    queryFn: () => fetchAdminDetail(id),
  });

  const userId = detailQuery.data?.id ?? null;
  const firstSchool = detailQuery.data?.owned_schools?.[0] ?? null;
  const schoolId = firstSchool?.id ?? null;

  const update = useMutation({
    mutationFn: (payload: any) => updateAdminClient(id, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: adminsKeys.detail(id) });
      await qc.invalidateQueries({ queryKey: adminsKeys.all });
      router.push(`/admins/${id}`);
    },
  });

  return (
    <AdminStepShell
      title="Edit Admin"
      description="Step 3: Client information"
      mode="edit"
      active="client"
      userId={userId}
      schoolId={schoolId}
      toPersonal={() => router.push(`/admins/${id}/edit/personal`)}
      toSchool={() => router.push(`/admins/${id}/edit/school`)}
      toClient={() => router.push(`/admins/${id}/edit/client`)}
    >
      <ClientStep
        mode="edit"
        initial={detailQuery.data ?? null}
        resetKey={`edit-client-${id}-${detailQuery.data ? "ready" : "loading"}`}
        submitLoading={update.isPending || detailQuery.isFetching}
        onSubmit={async (values) => {
          // If your backend requires school_id too, include it here.
          await update.mutateAsync({
            user_id: id,
            school_id: schoolId,
            ...values,
          });
        }}
      />
    </AdminStepShell>
  );
}

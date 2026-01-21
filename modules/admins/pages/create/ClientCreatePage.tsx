"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { AdminStepShell } from "../../components/AdminStepShell";
import { ClientStep } from "../../components/steps/ClientStep";
import { createAdminClient } from "../../api/admins.api";
import { adminsKeys } from "../../admins.keys";

export function ClientCreatePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const sp = useSearchParams();
  const userId = sp.get("userId");
  const schoolId = sp.get("schoolId");

  const clientCreate = useMutation({
    mutationFn: createAdminClient,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: adminsKeys.all });
      router.push("/admins");
    },
  });

  return (
    <AdminStepShell
      title="Create Admin"
      description="Step 3: Client information"
      mode="create"
      active="client"
      userId={userId}
      schoolId={schoolId}
      toPersonal={() => router.push("/admins/new/personal")}
      toSchool={() =>
        router.push(`/admins/new/school?userId=${encodeURIComponent(userId ?? "")}`)
      }
      toClient={() =>
        router.push(
          `/admins/new/client?userId=${encodeURIComponent(userId ?? "")}&schoolId=${encodeURIComponent(schoolId ?? "")}`
        )
      }
    >
      <ClientStep
        mode="create"
        initial={null}
        resetKey={`create-client-${userId ?? "missing"}-${schoolId ?? "missing"}`}
        submitLoading={clientCreate.isPending}
        onSubmit={async (values) => {
          if (!userId || !schoolId) throw new Error("Missing userId/schoolId");
          await clientCreate.mutateAsync({
            user_id: userId,
            school_id: schoolId,
            ...values,
          });
        }}
      />
    </AdminStepShell>
  );
}

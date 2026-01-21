"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { AdminStepShell } from "../../components/AdminStepShell";
import { SchoolStep } from "../../components/steps/SchoolStep";
import { createAdminSchool } from "../../api/admins.api";
import type { SchoolInfoValues } from "../../schema/admin.schema";

export function SchoolCreatePage() {
  const router = useRouter();
  const sp = useSearchParams();
  const userId = sp.get("userId");

  const schoolCreate = useMutation({
    mutationFn: createAdminSchool,
    onSuccess: (res) => {
      router.push(
        `/admins/new/client?userId=${encodeURIComponent(res.owner_id)}&schoolId=${encodeURIComponent(res.school_id)}`
      );
    },
  });

  return (
    <AdminStepShell
      title="Create Admin"
      description="Step 2: School information"
      mode="create"
      active="school"
      userId={userId}
      schoolId={null}
      toPersonal={() => router.push("/admins/new/personal")}
      toSchool={() => router.push(`/admins/new/school?userId=${encodeURIComponent(userId ?? "")}`)}
      toClient={() => {}}
    >
      <SchoolStep
        mode="create"
        resetKey={`create-school-${userId ?? "missing"}`}
        submitLoading={schoolCreate.isPending}
        initial={null}
        onSubmit={async (values: SchoolInfoValues) => {
          if (!userId) throw new Error("Missing userId");
          await schoolCreate.mutateAsync({
            owner_id: userId,
            ...values,
          });
        }}
      />
    </AdminStepShell>
  );
}

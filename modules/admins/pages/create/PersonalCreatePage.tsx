"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { AdminStepShell } from "../../components/AdminStepShell";
import { PersonalStep } from "../../components/steps/PersonalStep";
import { createAdminPersonal } from "../../api/admins.api";

export function PersonalCreatePage() {
  const router = useRouter();

  const personalCreate = useMutation({
    mutationFn: createAdminPersonal,
    onSuccess: (res) => {
      router.push(`/admins/new/school?userId=${encodeURIComponent(res.user_id)}`);
    },
  });

  return (
    <AdminStepShell
      title="Create Admin"
      description="Step 1: Personal information"
      mode="create"
      active="personal"
      userId={null}
      schoolId={null}
      toPersonal={() => router.push("/admins/new/personal")}
      toSchool={() => {}}
      toClient={() => {}}
    >
      <PersonalStep
        mode="create"
        initial={null}
        resetKey="create-personal"
        submitLoading={personalCreate.isPending}
        onSubmit={async (values) => {
          await personalCreate.mutateAsync(values);
        }}
      />
    </AdminStepShell>
  );
}

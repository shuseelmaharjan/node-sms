"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AdminStepShell } from "../../components/AdminStepShell";
import { SchoolStep } from "../../components/steps/SchoolStep";
import { fetchAdminDetail, updateAdminSchool } from "../../api/admins.api";
import { adminsKeys } from "../../admins.keys";
import type { SchoolInfoValues } from "../../schema/admin.schema";

export function SchoolEditPage({ id }: { id: string }) {
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
    mutationFn: (values: SchoolInfoValues) => {
      if (!schoolId) throw new Error("Missing schoolId");
      return updateAdminSchool(schoolId, values);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: adminsKeys.detail(id) });
      router.push(`/admins/${id}/edit/client`);
    },
  });

  const initial =
    firstSchool
      ? {
          code: firstSchool.code,
          name: firstSchool.name,
          address: firstSchool.address,
          phone: firstSchool.phone,
          email: firstSchool.email,
          is_active: firstSchool.is_active,

          logo_file_id: firstSchool.logo_file?.id ?? null,
          logo_file_url: firstSchool.logo_file?.file_url ?? null,

          pan_number: firstSchool.pan_number ?? "",
          registration_number: firstSchool.registration_number ?? "",

          pan_doc_id: firstSchool.pan_document_file?.id ?? null,
          pan_doc_url: firstSchool.pan_document_file?.file_url ?? null,

          reg_doc_id: firstSchool.registration_document_file?.id ?? null,
          reg_doc_url: firstSchool.registration_document_file?.file_url ?? null,
        }
      : null;

  return (
    <AdminStepShell
      title="Edit Admin"
      description="Step 2: School information"
      mode="edit"
      active="school"
      userId={userId}
      schoolId={schoolId}
      toPersonal={() => router.push(`/admins/${id}/edit/personal`)}
      toSchool={() => router.push(`/admins/${id}/edit/school`)}
      toClient={() => router.push(`/admins/${id}/edit/client`)}
    >
      <SchoolStep
        mode="edit"
        initial={initial}
        resetKey={`edit-school-${id}-${schoolId ?? "noschool"}-${detailQuery.data ? "ready" : "loading"}`}
        submitLoading={update.isPending || detailQuery.isFetching}
        externallyBlocked={detailQuery.isLoading || detailQuery.isError || !schoolId}
        onSubmit={async (values) => {
          await update.mutateAsync(values);
        }}
      />
    </AdminStepShell>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { api } from "@/api";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";

import type { StudentShortInfo } from "../types/confirm-enrollment.types";
import { StudentShortInfoPanel } from "./student-short-info-panel";
import { ConfirmEnrollmentForm } from "./confirm-enrollment-form";

const STUDENT_URL = (id: string) => `/api/v1/students-short-info/${id}/`;

const currencySymbol = process.env.NEXT_PUBLIC_APP_CURRENCY_SYMBOL || "NPR.";
const taxRate = Number(process.env.NEXT_PUBLIC_APP_TAX_RATE || 0) / 100;

export function ConfirmEnrollmentPage({ userId }: { userId: string }) {
  const router = useRouter();

  const studentQuery = useQuery<StudentShortInfo>({
    queryKey: ["student-enrollment", "student-short-info", userId],
    enabled: !!userId,
    queryFn: async () => (await api.get<StudentShortInfo>(STUDENT_URL(userId))).data,
  });

  const student = studentQuery.data;

  if (!userId) {
    return (
      <PageShell
        title="Confirm Enrollment"
        description="Missing user_id in query params."
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      >
        <div className="text-sm text-muted-foreground">
          Open like:{" "}
          <span className="font-mono">
            /student-enrollment/confirm-enrollment?user_id=...
          </span>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Confirm Enrollment"
      description="Review student info and enroll into batch/class with fee setup."
      actions={
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      }
    >
      {studentQuery.isLoading ? (
        <div className="text-sm text-muted-foreground">Loading student...</div>
      ) : studentQuery.isError ? (
        <div className="text-sm text-destructive">Failed to load student info.</div>
      ) : !student ? (
        <div className="text-sm text-muted-foreground">No student data.</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
          <StudentShortInfoPanel student={student} />

          <aside className="lg:sticky lg:top-4 h-fit">
            <ConfirmEnrollmentForm
              studentId={student.id}
              currencySymbol={currencySymbol}
              taxRate={taxRate}
            />
          </aside>
        </div>
      )}
    </PageShell>
  );
}

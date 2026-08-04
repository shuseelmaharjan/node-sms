"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";

import { api } from "@/api";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";

import {
  managementProfileApi,
  managementProfileKeys,
} from "../apis/management-profile.api";
import type { Student360Detail } from "../types/student360.types";
import { Student360FinanceSection } from "./student-360-details/finance-section";
import { Student360FeeStructureIncludes } from "./student-360-details/fee-structure-includes";
import { Student360HeaderCard } from "./student-360-details/header-card";
import { Student360ProfileSection } from "./student-360-details/profile-section";
import { Student360RecordsSection } from "./student-360-details/records-section";
import { useRecharts } from "./student-360-details/use-recharts";
import { n } from "./student-360-details/utils";

const DETAIL_URL = (id: string) => `/api/v1/students-360/${id}/`;

export function Student360DetailsPage({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopeBatch = searchParams.get("batch");
  const recharts = useRecharts();

  const detailQuery = useQuery<Student360Detail>({
    queryKey: ["students-360", "detail", id, { scopeBatch }],
    queryFn: async () => {
      const response = await api.get<Student360Detail>(DETAIL_URL(id), {
        params: { batch: scopeBatch || undefined },
      });
      return response.data;
    },
  });

  const data = detailQuery.data;

  /**
   * Most Student 360 responses use the user UUID as `id`.
   * Prefer explicit user references when the backend provides them.
   */
  const managementUserId =
    data?.user_id || data?.user?.id || data?.id || "";

  const managedProfileQuery = useQuery({
    queryKey: managementProfileKeys.detail(managementUserId),
    queryFn: () => managementProfileApi.getProfile(managementUserId),
    enabled: Boolean(managementUserId),
    staleTime: 60_000,
  });

  const managedProfile = managedProfileQuery.data ?? null;

  const photoDocument = React.useMemo(() => {
    const documents =
      managedProfile?.documents ?? data?.profile?.documents ?? [];

    return (
      documents.find((document) => document.document_type === "photo")?.file ??
      null
    );
  }, [data?.profile?.documents, managedProfile?.documents]);

  const avatarUrl =
    managedProfile?.user.profile_picture_file?.file_url ||
    data?.profile_picture?.file_url ||
    photoDocument?.file_url ||
    "";

  const latestWallet = React.useMemo(() => {
    const wallets = data?.wallets ?? [];
    if (!wallets.length) return null;

    return [...wallets].sort((first, second) =>
      String(second.updated_at).localeCompare(String(first.updated_at))
    )[0];
  }, [data?.wallets]);

  const paidProgress = React.useMemo(() => {
    if (!latestWallet) return 0;

    const payable = Math.max(0, n(latestWallet.total_payable));
    if (!payable) return 0;

    const paid = Math.max(0, n(latestWallet.total_paid));
    return Math.min(100, Math.round((paid / payable) * 100));
  }, [latestWallet]);

  const walletBars = React.useMemo(() => {
    const wallets = (data?.wallets ?? [])
      .slice()
      .sort((first, second) =>
        String(first.updated_at).localeCompare(String(second.updated_at))
      );

    return wallets.map((wallet) => ({
      name: `Batch ${wallet.batch}`,
      short: `B${wallet.batch}`,
      payable: n(wallet.total_payable),
      paid: n(wallet.total_paid),
      due: n(wallet.total_due),
      updated_at: wallet.updated_at,
    }));
  }, [data?.wallets]);

  const feeGroup = React.useMemo(() => {
    const groupedFees = new Map<string, number>();

    for (const fee of data?.fee_structures ?? []) {
      const group = fee.fee_head_detail?.group || "OTHER";
      groupedFees.set(group, (groupedFees.get(group) ?? 0) + n(fee.amount));
    }

    return Array.from(groupedFees.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((first, second) => second.value - first.value);
  }, [data?.fee_structures]);

  const batchItems = data?.batches_meta?.items ?? [];

  const onPickBatch = (batchId: string | null) => {
    const url = new URL(window.location.href);

    if (batchId) url.searchParams.set("batch", batchId);
    else url.searchParams.delete("batch");

    router.push(url.pathname + url.search);
  };

  return (
    <PageShell
      title="Student Dashboard"
      description="Profile, academics and finance overview."
      actions={
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      }
    >
      {detailQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading student details...
        </div>
      ) : detailQuery.isError ? (
        <div className="text-sm text-destructive">
          Failed to load student details.
        </div>
      ) : !data ? (
        <div className="text-sm text-muted-foreground">No data.</div>
      ) : (
        <div className="space-y-6">
          {managedProfileQuery.isError ? (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="font-medium text-destructive">
                  Editable profile could not be loaded
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Academic and finance records are still available, but profile
                  edit actions are disabled. Verify the management API prefix and
                  the student user ID.
                </p>
              </div>
            </div>
          ) : managedProfileQuery.isLoading ? (
            <div className="flex items-center gap-2 rounded-xl border bg-muted/20 p-3 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading editable profile...
            </div>
          ) : null}

          <Student360HeaderCard
            studentId={id}
            managementUserId={managementUserId}
            data={data}
            managedProfile={managedProfile}
            avatarUrl={avatarUrl}
            latestWallet={latestWallet}
            paidProgress={paidProgress}
            batchItems={batchItems}
            scopeBatch={scopeBatch}
            onPickBatch={onPickBatch}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
            <Student360ProfileSection
              studentId={id}
              managementUserId={managementUserId}
              data={data}
              managedProfile={managedProfile}
            />

            <Student360FeeStructureIncludes
              feeStructures={data.fee_structures ?? []}
              feeIncludes={data.fee_includes ?? []}
            />
          </div>

          <Student360FinanceSection
            walletBars={walletBars}
            recharts={recharts}
            feeGroup={feeGroup}
          />

          <Student360RecordsSection data={data} />
        </div>
      )}
    </PageShell>
  );
}

"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { api } from "@/api";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";

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
  const sp = useSearchParams();
  const scopeBatch = sp.get("batch");

  const recharts = useRecharts();

  const detailQuery = useQuery<Student360Detail>({
    queryKey: ["students-360", "detail", id, { scopeBatch }],
    queryFn: async () =>
      (
        await api.get<Student360Detail>(DETAIL_URL(id), {
          params: { batch: scopeBatch || undefined },
        })
      ).data,
  });

  const data = detailQuery.data;

  const photoDoc = React.useMemo(() => {
    const docs = data?.profile?.documents ?? [];
    return docs.find((d) => d.document_type === "photo")?.file ?? null;
  }, [data]);

  const avatarUrl = data?.profile_picture?.file_url || photoDoc?.file_url || "";

  const latestWallet = React.useMemo(() => {
    const ws = data?.wallets ?? [];
    if (!ws.length) return null;
    return [...ws].sort((a, b) =>
      String(b.updated_at).localeCompare(String(a.updated_at))
    )[0];
  }, [data]);

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
      .sort((a, b) => String(a.updated_at).localeCompare(String(b.updated_at)));

    return wallets.map((w) => ({
      name: `Batch ${w.batch}`,
      short: `B${w.batch}`,
      payable: n(w.total_payable),
      paid: n(w.total_paid),
      due: n(w.total_due),
      updated_at: w.updated_at,
    }));
  }, [data]);

  const feeGroup = React.useMemo(() => {
    const fs = data?.fee_structures ?? [];
    const byGroup = new Map<string, number>();
    for (const f of fs) {
      const g = f.fee_head_detail?.group || "OTHER";
      byGroup.set(g, (byGroup.get(g) ?? 0) + n(f.amount));
    }
    return Array.from(byGroup.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const batchItems = data?.batches_meta?.items ?? [];

  const onPickBatch = (batchId: string | null) => {
    const url = new URL(window.location.href);
    if (!batchId) url.searchParams.delete("batch");
    else url.searchParams.set("batch", batchId);
    router.push(url.pathname + url.search);
  };

  return (
    <PageShell
      title="Student 360°"
      description="Profile + Academics + Finance dashboard."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      }
    >
      {detailQuery.isLoading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : detailQuery.isError ? (
        <div className="text-sm text-destructive">Failed to load details.</div>
      ) : !data ? (
        <div className="text-sm text-muted-foreground">No data.</div>
      ) : (
        <div className="space-y-6">
          <Student360HeaderCard
            data={data}
            avatarUrl={avatarUrl}
            latestWallet={latestWallet}
            paidProgress={paidProgress}
            batchItems={batchItems}
            scopeBatch={scopeBatch}
            onPickBatch={onPickBatch}
          />

          {/* Row: Profile (left) + Fees & Includes (right) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
            <Student360ProfileSection data={data} />
            
            <Student360FeeStructureIncludes
              feeStructures={data.fee_structures ?? []}
              feeIncludes={data.fee_includes ?? []}
            />
          </div>

          {/* Row: Finance Overview, Fee Group Split, Fee Group Progress */}
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

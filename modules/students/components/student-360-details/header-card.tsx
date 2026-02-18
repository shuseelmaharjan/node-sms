import * as React from "react";
import Image from "next/image";
import { CreditCard, IdCard, TrendingUp, User2 } from "lucide-react";

import { Badge, normalizeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDateShort, formatDateTime, toSentenceCase } from "@/utils/text-utils";

import type { BatchMetaItem, Student360Detail, WalletRow } from "../../types/student360.types";
import { MiniStat, ScopePill } from "./shared";
import { money } from "./utils";
import { PayBillModal } from "./pay-bill-modal";

export function Student360HeaderCard({
  data,
  avatarUrl,
  latestWallet,
  paidProgress,
  batchItems,
  scopeBatch,
  onPickBatch,
}: {
  data: Student360Detail;
  avatarUrl: string;
  latestWallet: WalletRow | null;
  paidProgress: number;
  batchItems: BatchMetaItem[];
  scopeBatch: string | null;
  onPickBatch: (batchId: string | null) => void;
}) {
  const [payBillOpen, setPayBillOpen] = React.useState(false);

  const latestEnrollment = React.useMemo(() => {
    if (!data.enrollments?.length) return null;

    return [...data.enrollments].sort((a, b) => {
      const aTime = new Date(a.enrolled_at).getTime();
      const bTime = new Date(b.enrolled_at).getTime();
      return bTime - aTime;
    })[0];
  }, [data.enrollments]);

  return (
    <>
      <Card className="border-0 shadow-none px-0 py-0 ">
        <CardContent className="px-0">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px] lg:items-start">
            {/* LEFT */}
            <div className="rounded-xl border bg-background p-5 shadow-sm">
              {/* Header */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                {/* Avatar */}
                <div className="flex items-start gap-4">
                  <div className="relative h-[72px] w-[72px] sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-2xl border bg-muted shadow-sm">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={data.full_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <User2 className="h-7 w-7" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Name + meta */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-semibold leading-tight truncate">
                      {data.full_name}
                    </h2>
                    <Badge
                      variant={normalizeVariant(data.role)}
                      label={toSentenceCase(data.role)}
                    />
                    <Badge
                      variant={normalizeVariant(data.status)}
                      label={toSentenceCase(data.status)}
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
                      @{data.username}
                    </span>

                    <span className="text-muted-foreground/60">•</span>

                    <span className="inline-flex items-center gap-2 rounded-md bg-muted px-2 py-0.5">
                      <IdCard className="h-4 w-4" />
                      <span>Reg</span>
                      <span className="font-medium text-foreground">
                        {data.registration_no || "—"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Enrollment */}
              <div className="mt-3 rounded-2xl border bg-muted/10 px-4">
                {/* <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Enrollment</div>
                  <div className="text-sm font-semibold">Current enrollment</div>
                </div>

                {latestEnrollment?.status ? (
                  <Badge
                    variant={normalizeVariant(latestEnrollment.status)}
                    label={toSentenceCase(latestEnrollment.status)}
                  />
                ) : null}
              </div> */}

                {latestEnrollment ? (
                  <div className="mt-4 grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
                    <InfoTile
                      label="Enrolled at"
                      value={formatDateShort(latestEnrollment.enrolled_at)}
                    />
                    <InfoTile label="Batch" value={latestEnrollment.batch?.name || "—"} />
                    <InfoTile
                      label="Batch (BS)"
                      value={`${latestEnrollment.batch?.start_date_bs || "—"} — ${latestEnrollment.batch?.end_date_bs || "—"}`}
                    />
                    <InfoTile
                      label="Class"
                      value={latestEnrollment.academic_class?.name || "—"}
                    />
                    <InfoTile
                      label="Section"
                      value={latestEnrollment.section?.name || "—"}
                    />
                    <InfoTile
                      label="Batch (AD)"
                      value={`${latestEnrollment.batch?.start_date_ad || "—"} — ${latestEnrollment.batch?.end_date_ad || "—"}`}
                    />
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl bg-background p-4 text-sm text-muted-foreground">
                    No enrollment data
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT */}
            <div className="grid grid-cols-1 gap-3">
              <Card className="border-0 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm text-white/80 flex items-center gap-2 justify-between">
                        <span className="inline-flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Financial Snapshot
                        </span>

                      </div>
                      <div className="mt-1 text-lg font-semibold flex items-center gap-2 justify-between">
                        {latestWallet ? (
                          <span>
                            NPR {money(latestWallet.total_due)}{" "}
                            <span className="text-white/70 text-sm font-normal">Due</span>
                          </span>
                        ) : (
                          "No wallet"
                        )}

                      </div>
                      <div className="mt-1 text-xs text-white/70">
                        {latestWallet ? (
                          <>Last updated: {formatDateTime(latestWallet.updated_at)}</>
                        ) : (
                          "—"
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end">

                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setPayBillOpen(true)}
                        className="h-8"
                      >
                        Pay Bill
                      </Button>
                      {/* <div className="flex flex-col items-end mt-2">
                          <Badge
                            variant="other"
                            label={
                              <span className="flex items-center gap-1 text-white">
                                <TrendingUp className="h-3 w-3" />
                                {paidProgress}% paid
                              </span> as any
                            }
                          />
                          <div className="mt-2 w-40">
                            <Progress value={paidProgress} />
                          </div>
                        </div> */}
                    </div>
                  </div>

                  {latestWallet ? (
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <MiniStat k="Payable" v={`NPR ${money(latestWallet.total_payable)}`} />
                      <MiniStat k="Paid" v={`NPR ${money(latestWallet.total_paid)}`} />
                      <MiniStat k="Discount" v={`NPR ${money(latestWallet.total_discount)}`} />
                      <MiniStat k="Scholarship" v={`NPR ${money(latestWallet.total_scholarship)}`} />
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {/* <div className="rounded-2xl border bg-muted/10 p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Batch Scope</div>
                <Badge variant="other" label={scopeBatch ? `Batch ${scopeBatch}` : "All"} />
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {batchItems.map((b) => (
                  <ScopePill
                    key={b.batch_id}
                    active={String(b.batch_id) === String(scopeBatch)}
                    label={b.batch_name}
                    right={
                      <Badge
                        variant={normalizeVariant(b.latest_status)}
                        label={toSentenceCase(b.latest_status)}
                      />
                    }
                    onClick={() => onPickBatch(String(b.batch_id))}
                  />
                ))}
              </div>
            </div> */}
            </div>
          </div>
        </CardContent>
      </Card>

      <PayBillModal
        open={payBillOpen}
        onOpenChange={setPayBillOpen}
        studentId={data.id}
      />
    </>
  );
}
/** Small helper component (put below in same file) */
function InfoTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-background px-3 py-2.5 ring-1 ring-black/5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium text-foreground truncate">{value}</div>
    </div>
  );
}

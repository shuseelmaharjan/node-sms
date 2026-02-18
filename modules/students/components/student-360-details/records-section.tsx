import * as React from "react";
import { GraduationCap, History, Receipt, ShieldCheck } from "lucide-react";

import { Badge, normalizeVariant } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime, toSentenceCase } from "@/utils/text-utils";

import type { BillingRow, Student360Detail } from "../../types/student360.types";
import { FeeIncludePrettyCard, FeeStructurePrettyCard } from "./fee-cards";
import { SectionHeader } from "./shared";
import { money } from "./utils";

export function Student360RecordsSection({ data }: { data: Student360Detail }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Records</CardTitle>
        <CardDescription>Academics and finance records.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="enrollments" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
            <TabsTrigger value="billings">Billings</TabsTrigger>
            <TabsTrigger value="audits">Audits</TabsTrigger>
            <TabsTrigger value="feesAll">All Fees</TabsTrigger>
          </TabsList>

          <TabsContent value="enrollments" className="mt-4">
            <SectionHeader
              icon={<GraduationCap className="h-4 w-4" />}
              title="Enrollment History"
              count={data.enrollments?.length ?? 0}
            />
            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {(data.enrollments ?? []).map((e) => (
                <Card
                  key={e.id}
                  className="border bg-gradient-to-br from-muted/40 to-background"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">
                          {e.batch?.name} • {e.academic_class?.name}
                          {e.section?.name ? ` • ${e.section.name}` : ""}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Enrolled: {formatDateTime(e.enrolled_at)}
                        </div>
                      </div>
                      <Badge
                        variant={normalizeVariant(e.status)}
                        label={toSentenceCase(e.status)}
                      />
                    </div>

                    <Separator className="my-3" />

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="rounded-lg border p-2">
                        <div className="font-medium text-foreground">BS</div>
                        <div>
                          {e.batch.start_date_bs} → {e.batch.end_date_bs}
                        </div>
                      </div>
                      <div className="rounded-lg border p-2">
                        <div className="font-medium text-foreground">AD</div>
                        <div>
                          {e.batch.start_date_ad} → {e.batch.end_date_ad}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!data.enrollments?.length ? (
                <div className="text-sm text-muted-foreground">No enrollments.</div>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="billings" className="mt-4">
            <SectionHeader
              icon={<Receipt className="h-4 w-4" />}
              title="Billings"
              count={data.billings?.length ?? 0}
            />
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {(data.billings ?? []).map((b: BillingRow, idx: number) => (
                <Card
                  key={b?.id ?? idx}
                  className="border bg-gradient-to-br from-muted/40 to-background"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">
                          Receipt: {b.receipt_number ?? "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(b.created_at)}
                        </div>
                      </div>
                      <Badge
                        variant={normalizeVariant(b.status)}
                        label={toSentenceCase(b.status)}
                      />
                    </div>

                    <Separator className="my-3" />

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">Amount</div>
                      <div className="text-sm font-semibold tabular-nums">
                        NPR {money(b.amount)}
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground space-y-1">
                      <div>Method: {b.payment_method ?? "-"}</div>
                      {b.description ? (
                        <div className="line-clamp-2">Desc: {b.description}</div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!data.billings?.length ? (
                <div className="text-sm text-muted-foreground">No billings.</div>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="audits" className="mt-4">
            <SectionHeader
              icon={<History className="h-4 w-4" />}
              title="Fee Include Audits"
              count={data.fee_include_audits?.length ?? 0}
            />
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {(data.fee_include_audits ?? []).map((a) => (
                <Card
                  key={a.id}
                  className="border bg-gradient-to-br from-muted/40 to-background"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">
                          Action: {toSentenceCase(a.action)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(a.created_at)}
                        </div>
                      </div>
                      <Badge variant="other" label={a.new_status || "-"} />
                    </div>

                    <Separator className="my-3" />

                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Actor: {a.actor ?? "-"}</div>
                      <div className="truncate">FeeInclude: {a.fee_include}</div>
                      <div>
                        Batch: {a.prev_batch_id ?? "-"} → {a.new_batch_id ?? "-"}
                      </div>
                      <div className="truncate">
                        Class: {a.prev_class_id ?? "-"} → {a.new_class_id ?? "-"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!data.fee_include_audits?.length ? (
                <div className="text-sm text-muted-foreground">No audits.</div>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="feesAll" className="mt-4">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <SectionHeader
                  icon={<Receipt className="h-4 w-4" />}
                  title="Fee Structures"
                  count={data.fee_structures?.length ?? 0}
                />
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {(data.fee_structures ?? []).map((f) => (
                    <FeeStructurePrettyCard key={f.id} fee={f} />
                  ))}
                  {!data.fee_structures?.length ? (
                    <div className="text-sm text-muted-foreground">No fee structures.</div>
                  ) : null}
                </div>
              </div>

              <div>
                <SectionHeader
                  icon={<ShieldCheck className="h-4 w-4" />}
                  title="Fee Includes"
                  count={data.fee_includes?.length ?? 0}
                />
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {(data.fee_includes ?? []).map((x) => (
                    <FeeIncludePrettyCard key={x.id} item={x} />
                  ))}
                  {!data.fee_includes?.length ? (
                    <div className="text-sm text-muted-foreground">No fee includes.</div>
                  ) : null}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

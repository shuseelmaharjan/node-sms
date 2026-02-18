import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toSentenceCase } from "@/utils/text-utils";

import type { FeeIncludeRow, FeeStructureRow } from "../../types/student360.types";
import { money } from "./utils";

function feeGroupTheme(group?: string) {
  switch (group) {
    case "TUITION":
      return {
        grad: "from-sky-500/20 via-indigo-500/15 to-fuchsia-500/10",
        ring: "ring-sky-500/15",
        bar: "bg-gradient-to-b from-sky-500 to-indigo-600",
        glow: "bg-sky-400/10",
      };
    case "EXAM":
      return {
        grad: "from-amber-500/20 via-orange-500/15 to-rose-500/10",
        ring: "ring-amber-500/15",
        bar: "bg-gradient-to-b from-amber-500 to-orange-600",
        glow: "bg-amber-400/10",
      };
    case "ONE_TIME":
      return {
        grad: "from-fuchsia-500/20 via-rose-500/15 to-purple-500/10",
        ring: "ring-fuchsia-500/15",
        bar: "bg-gradient-to-b from-fuchsia-500 to-rose-600",
        glow: "bg-fuchsia-400/10",
      };
    default:
      return {
        grad: "from-emerald-500/20 via-cyan-500/15 to-sky-500/10",
        ring: "ring-emerald-500/15",
        bar: "bg-gradient-to-b from-emerald-500 to-cyan-600",
        glow: "bg-emerald-400/10",
      };
  }
}

export function FeeStructurePrettyCard({ fee }: { fee: FeeStructureRow }) {
  const head = fee.fee_head_detail?.name ?? "Fee";
  const code = fee.fee_head_detail?.code ?? "";
  const group = fee.fee_head_detail?.group ?? "OTHER";

  const t = feeGroupTheme(group);

  return (
    <Card
      className={cn(
        "relative overflow-hidden border bg-gradient-to-br",
        t.grad,
        "shadow-sm ring-1 ring-black/5",
        t.ring,
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      )}
    >
      {/* soft glow blob */}
      <div
        className={cn(
          "pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full blur-3xl",
          t.glow
        )}
      />
      {/* subtle grid texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:22px_22px]" />

      <CardContent className="relative p-4">
        <div className="flex items-start gap-3">
          {/* left accent bar */}
          <div className={cn("mt-1 h-10 w-1.5 rounded-full", t.bar)} />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold truncate">
                  {head}
                </div>

                <div className="mt-0.5 text-xs text-muted-foreground">
                  {toSentenceCase(fee.period) ?? "-"} •{" "}
                  {fee.tax_included ? "Tax included" : "Tax excluded"}
                </div>
              </div>
            </div>

            <Separator className="my-3 opacity-60" />

            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Amount</div>
              <div className="text-sm font-semibold tabular-nums">
                {money(fee.amount)} {fee.currency}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FeeIncludePrettyCard({ item }: { item: FeeIncludeRow }) {
  const feeName = item.fee_detail?.fee_head_detail?.name ?? item.fees;

  const amount = item.fee_detail?.amount;
  const currency = item.fee_detail?.currency;

  const period = item.fee_detail?.period; 
  const taxIncluded = item.fee_detail?.tax_included; 

  const group = item.fee_detail?.fee_head_detail?.group ?? "OTHER";
  const t = feeGroupTheme(group);

  return (
    <Card
      className={cn(
        "relative overflow-hidden border",
        "bg-gradient-to-br",
        t.grad,
        "shadow-sm ring-1 ring-black/5",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      )}
    >
      {/* glow */}
      <div
        className={cn(
          "pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full blur-3xl",
          t.glow
        )}
      />
      {/* subtle grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:linear-gradient(to_right,rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:22px_22px]" />

      <CardContent className="relative p-4">
        <div className="flex items-start gap-3">
          {/* left accent bar */}
          <div className={cn("mt-1 h-10 w-1.5 rounded-full", t.bar)} />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold truncate">{toSentenceCase(feeName)}</div>

                <div className="mt-0.5 text-xs text-muted-foreground">
                  {toSentenceCase(period) ?? "-"} • {taxIncluded ? "Tax included" : "Tax excluded"}
                </div>
              </div>
            </div>

            <Separator className="my-3 opacity-60" />

            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Amount</div>
              <div className="text-sm font-semibold tabular-nums">
                {amount ? money(amount) : "-"}{" "}
                <span className="text-muted-foreground">{currency ?? ""}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

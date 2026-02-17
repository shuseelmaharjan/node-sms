"use client";

import * as React from "react";
import { InfoIcon } from "lucide-react";

import { Badge, normalizeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import type { ApplicableFeeStructure } from "../types/confirm-enrollment.types";
import { toSentenceCase } from "@/utils/text-utils";

/* ---- helpers (exported so form can reuse if needed) ---- */

export function safeMoney(n: number) {
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

export function toNum(v: unknown) {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
}

// Whole-month buckets (inclusive): Feb 17 -> Apr 13 => Feb, Mar, Apr => 3
export function monthsUntilEndWhole(endDateISO: string) {
  const now = new Date();
  const end = new Date(endDateISO);

  if (Number.isNaN(end.getTime())) return 0;

  const nowYM = now.getFullYear() * 12 + now.getMonth();
  const endYM = end.getFullYear() * 12 + end.getMonth();

  if (endYM < nowYM) return 0;

  return endYM - nowYM + 1;
}

export function multiplierForPeriod(
  period: ApplicableFeeStructure["period"],
  batchEndAd?: string | null
) {
  if (!batchEndAd) return 1;

  const months = monthsUntilEndWhole(batchEndAd);

  if (period === "MONTHLY") return months;
  if (period === "QUARTERLY") return Math.max(1, Math.ceil(months / 3));
  if (period === "SEMESTER") return Math.max(1, Math.ceil(months / 6));
  return 1;
}

export function periodLabel(period: ApplicableFeeStructure["period"]) {
  switch (period) {
    case "MONTHLY":
      return "Monthly";
    case "QUARTERLY":
      return "Quarterly (3 months)";
    case "SEMESTER":
      return "Semester (6 months)";
    case "ANNUAL":
      return "Annual";
    case "OTHER":
      return "Other";
    case "ONE_TIME":
      return "One time";
    default:
      return period;
  }
}

/* ---- component ---- */

export function FeeItemsList(props: {
  feeRows: ApplicableFeeStructure[];
  selectedIds: string[];
  onToggle: (id: string, checked: boolean) => void;
  batchEndAd?: string | null;

  currencySymbol: string; // e.g. "NPR."
  taxRate: number; // e.g. 0.13 (13%)
}) {
  const { feeRows, selectedIds, onToggle, batchEndAd, currencySymbol, taxRate } = props;

  const formatCurrency = React.useCallback(
    (amount: number | string) => {
      const num = typeof amount === "string" ? toNum(amount) : amount;
      return `${currencySymbol} ${safeMoney(num)}`;
    },
    [currencySymbol]
  );

  function calculateNetAmount(grossAmount: number, taxIncluded: boolean): number {
    if (!taxIncluded || taxRate === 0) return grossAmount;
    return grossAmount / (1 + taxRate);
  }

  return (
    <div className="space-y-2">
      {feeRows.map((f) => {
        const checked = selectedIds.includes(f.id);

        const mult = multiplierForPeriod(f.period, batchEndAd ?? null);
        const base = Number(f.amount || 0);
        const lineAmount = base * mult;

        const netAmount = calculateNetAmount(lineAmount, (f as any).tax_included ?? false);
        const taxAmount = lineAmount - netAmount;

        return (
          <div
            key={f.id}
            className="flex items-start justify-between gap-2 rounded-md border p-3"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Checkbox
                checked={checked}
                onCheckedChange={(v) => onToggle(f.id, !!v)}
              />

              <div className="min-w-0 flex-1">
                <div className="font-medium leading-5 truncate">
                  {f.fee_head_detail?.name ?? "Fee"}
                </div>

                <div className="text-xs text-muted-foreground">
                  {periodLabel(f.period)}
                  {mult > 1 ? ` • × ${mult}` : ""}
                </div>

                <div className="text-sm font-semibold text-foreground mt-1">
                  {formatCurrency(netAmount)}
                </div>
              </div>
            </div>

            <FeeDetailDrawer
              fee={f}
              multiplier={mult}
              lineAmount={lineAmount}
              netAmount={netAmount}
              taxAmount={taxAmount}
              formatCurrency={formatCurrency}
              taxRate={taxRate}
            />
          </div>
        );
      })}
    </div>
  );
}

function FeeDetailDrawer(props: {
  fee: ApplicableFeeStructure;
  multiplier: number;
  lineAmount: number;
  netAmount: number;
  taxAmount: number;
  formatCurrency: (n: number | string) => string;
  taxRate: number;
}) {
  const { fee, multiplier, lineAmount, netAmount, taxAmount, formatCurrency, taxRate } = props;

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View fee details">
          <InfoIcon className="h-4 w-4" />
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <div className="mx-auto w-full max-w-xl">
          <DrawerHeader>
            <DrawerTitle>{fee.fee_head_detail?.name ?? "Fee Details"}</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-4 space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="text-xs text-muted-foreground">Fee</div>
              <div className="text-base font-semibold">
                {fee.fee_head_detail?.name ?? "Fee"}{" "}
                {(fee as any).tax_included && taxRate > 0 ? (
                  <span className="text-xs text-muted-foreground">
                    (includes {(taxRate * 100).toFixed(0)}% tax)
                  </span>
                ) : null}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Period</span>
                <span className="font-medium">{periodLabel(fee.period)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant={normalizeVariant(fee.status)}
                  label={toSentenceCase(fee.status)}
                />
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="text-sm font-semibold">Calculation</div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base amount</span>
                <span className="font-medium">{formatCurrency(Number(fee.amount || 0))}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Multiplier</span>
                <span className="font-medium">× {multiplier}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Line total</span>
                <span className="font-medium">{formatCurrency(lineAmount)}</span>
              </div>

              {taxAmount > 0 ? (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Tax ({(taxRate * 100).toFixed(0)}%)
                  </span>
                  <span className="font-medium">{formatCurrency(taxAmount)}</span>
                </div>
              ) : null}

              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Net (enrollment)</span>
                <span className="font-semibold">{formatCurrency(netAmount)}</span>
              </div>
            </div>
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

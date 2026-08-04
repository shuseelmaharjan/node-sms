"use client";

import * as React from "react";
import { Banknote, CalendarRange, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/api";
import { Badge, normalizeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toSentenceCase } from "@/utils/text-utils";

import { studentFinanceApi } from "../../../apis/student-finance.api";
import type { FeeInvoice } from "../../../types/finance.types";
import { InvoiceAmount } from "./shared";
import {
  formatMoney,
  getNepaliBillingPeriod,
  isOutstanding,
} from "./utils";

export function InvoiceRow({
  invoice,
  onPay,
}: {
  invoice: FeeInvoice;
  onPay: () => void;
}) {
  const [downloading, setDownloading] = React.useState(false);

  const nepaliBillingPeriod = React.useMemo(
    () => getNepaliBillingPeriod(invoice.period_start, invoice.period_end),
    [invoice.period_start, invoice.period_end]
  );

  const outstanding = isOutstanding(invoice);
  const hasPayment = Number(invoice.paid_amount) > 0;

  return (
    <div className="rounded-xl border bg-background p-4 transition-colors hover:bg-muted/20">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{invoice.invoice_number}</span>
            <Badge
              variant={normalizeVariant(invoice.status)}
              label={toSentenceCase(invoice.status)}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {nepaliBillingPeriod ? (
              <div className="inline-flex w-fit items-center gap-3 rounded-xl border bg-primary/5 px-3 py-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <CalendarRange className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold">
                    {nepaliBillingPeriod.month.label.split(" (")[0]}{" "}
                    {nepaliBillingPeriod.bsYear}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {nepaliBillingPeriod.month.label.match(/\((.*?)\)/)?.[1]}{" "}
                    billing period
                  </div>
                </div>
              </div>
            ) : null}

            <InvoiceAmount
              label="Bill amount"
              value={formatMoney(invoice.total_amount, invoice.currency)}
              tone="success"
            />
            <InvoiceAmount
              label="Paid amount"
              value={formatMoney(invoice.paid_amount, invoice.currency)}
              tone={hasPayment ? "neutral" : "neutral"}
            />
            <InvoiceAmount
              label="Remaining due"
              value={formatMoney(invoice.due_amount, invoice.currency)}
              tone={outstanding ? "warning" : "success"}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:shrink-0">
          <Button
            size="sm"
            variant="outline"
            disabled={downloading}
            onClick={async () => {
              try {
                setDownloading(true);
                await studentFinanceApi.downloadInvoicePdf(invoice);
              } catch (error) {
                toast.error(
                  getApiErrorMessage(error) ||
                    "Failed to download invoice PDF"
                );
              } finally {
                setDownloading(false);
              }
            }}
          >
            {downloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Invoice PDF
          </Button>

          {outstanding ? (
            <Button size="sm" onClick={onPay}>
              <Banknote className="mr-2 h-4 w-4" />
              Record payment
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

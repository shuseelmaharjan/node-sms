"use client";

import * as React from "react";
import { Loader2, ReceiptText } from "lucide-react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/api";
import { Badge, normalizeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, toSentenceCase } from "@/utils/text-utils";

import { studentFinanceApi } from "../../../apis/student-finance.api";
import type { FeePayment } from "../../../types/finance.types";
import { formatMoney } from "./utils";

export function PaymentRow({ payment }: { payment: FeePayment }) {
  const [downloading, setDownloading] = React.useState(false);

  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{payment.receipt_number}</span>
            <Badge
              variant={normalizeVariant(payment.status)}
              label={toSentenceCase(payment.status)}
            />
          </div>

          <div className="text-xs text-muted-foreground">
            {formatDateTime(payment.paid_at)} ·{" "}
            {toSentenceCase(payment.payment_method)}
          </div>

          <div className="text-sm">
            Paid {formatMoney(payment.amount, payment.currency)} · Remaining due{" "}
            {formatMoney(payment.after_payment_due, payment.currency)}
          </div>

          {payment.allocations?.length ? (
            <div className="text-xs text-muted-foreground">
              Applied to{" "}
              {payment.allocations
                .map((allocation) => allocation.invoice_number)
                .join(", ")}
            </div>
          ) : null}
        </div>

        <Button
          size="sm"
          variant="outline"
          disabled={downloading || payment.status === "REVERSED"}
          onClick={async () => {
            try {
              setDownloading(true);
              await studentFinanceApi.downloadReceiptPdf(payment);
            } catch (error) {
              toast.error(
                getApiErrorMessage(error) ||
                  "Failed to download receipt PDF"
              );
            } finally {
              setDownloading(false);
            }
          }}
        >
          {downloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ReceiptText className="mr-2 h-4 w-4" />
          )}
          Receipt PDF
        </Button>
      </div>
    </div>
  );
}

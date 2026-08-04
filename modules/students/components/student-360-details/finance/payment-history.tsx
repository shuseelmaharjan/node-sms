import { Loader2 } from "lucide-react";

import { Separator } from "@/components/ui/separator";

import type { FeePayment } from "../../../types/finance.types";
import { EmptyRecord } from "./shared";
import { PaymentRow } from "./payment-row";

export function PaymentHistory({
  payments,
  isLoading,
  isFetching,
  isError,
}: {
  payments: FeePayment[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}) {
  return (
    <>
      <Separator />
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Payment history</h3>
            <p className="text-xs text-muted-foreground">
              Posted receipts and their invoice allocations.
            </p>
          </div>
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : null}
        </div>

        <div className="space-y-3">
          {payments.map((payment) => (
            <PaymentRow key={payment.id} payment={payment} />
          ))}
          {!isLoading && !payments.length ? (
            <EmptyRecord text="No payments posted yet." />
          ) : null}
          {isError ? (
            <EmptyRecord text="Payment history could not be loaded. Confirm that GET /fee-payments/ is enabled." />
          ) : null}
        </div>
      </section>
    </>
  );
}

import { Loader2 } from "lucide-react";

import type { FeeInvoice } from "../../../types/finance.types";
import { EmptyRecord } from "./shared";
import { InvoiceRow } from "./invoice-row";

export function InvoiceHistory({
  invoices,
  isLoading,
  isFetching,
  isError,
  onPay,
}: {
  invoices: FeeInvoice[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onPay: (invoice: FeeInvoice) => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Invoice history</h3>
          <p className="text-xs text-muted-foreground">
            Each invoice remains the permanent billing record for its period.
          </p>
        </div>
        {isFetching ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : null}
      </div>

      <div className="space-y-3">
        {invoices.map((invoice) => (
          <InvoiceRow
            key={invoice.id}
            invoice={invoice}
            onPay={() => onPay(invoice)}
          />
        ))}
        {!isLoading && !invoices.length ? (
          <EmptyRecord text="No invoices generated yet." />
        ) : null}
        {isError ? (
          <EmptyRecord text="Invoice history could not be loaded." />
        ) : null}
      </div>
    </section>
  );
}

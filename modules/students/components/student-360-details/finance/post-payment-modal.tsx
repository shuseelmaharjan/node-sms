"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Banknote,
  CheckCircle2,
  CircleHelp,
  CreditCard,
  Loader2,
  ReceiptText,
} from "lucide-react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { studentFinanceApi } from "../../../apis/student-finance.api";
import type {
  FeeInvoice,
  PaymentMethod,
} from "../../../types/finance.types";
import { PAYMENT_METHODS } from "./constants";
import {
  formatDisplayDate,
  formatMoney,
  getNepaliBillingPeriod,
} from "./utils";

type PostPaymentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollmentId: string;
  invoices: FeeInvoice[];
  selectedInvoice: FeeInvoice | null;
  selectedInvoiceId: string;
  onSelectedInvoiceIdChange: (value: string) => void;
  onSuccess: () => Promise<void>;
};

export function PostPaymentModal({
  open,
  onOpenChange,
  enrollmentId,
  invoices,
  selectedInvoice,
  selectedInvoiceId,
  onSelectedInvoiceIdChange,
  onSuccess,
}: PostPaymentModalProps) {
  const [amount, setAmount] = React.useState("");
  const [paymentMethod, setPaymentMethod] =
    React.useState<PaymentMethod>("CASH");
  const [externalReference, setExternalReference] =
    React.useState("");
  const [notes, setNotes] = React.useState("");
  const [idempotencyKey, setIdempotencyKey] =
    React.useState("");

  const selectedNepaliBillingPeriod = React.useMemo(() => {
    if (!selectedInvoice) {
      return null;
    }

    return getNepaliBillingPeriod(
      selectedInvoice.period_start,
      selectedInvoice.period_end
    );
  }, [
    selectedInvoice?.period_start,
    selectedInvoice?.period_end,
  ]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setAmount(selectedInvoice?.due_amount ?? "");
    setPaymentMethod("CASH");
    setExternalReference("");
    setNotes("");
    setIdempotencyKey(crypto.randomUUID());
  }, [
    open,
    selectedInvoice?.id,
    selectedInvoice?.due_amount,
  ]);

  const mutation = useMutation({
    mutationFn: () =>
      studentFinanceApi.postPayment({
        enrollment_id: enrollmentId,
        amount,
        paid_at: new Date().toISOString(),
        payment_method: paymentMethod,
        invoice_ids: selectedInvoiceId
          ? [selectedInvoiceId]
          : [],
        auto_allocate: false,
        external_reference: externalReference.trim(),
        notes: notes.trim(),
        idempotency_key:
          idempotencyKey || crypto.randomUUID(),
      }),

    onSuccess: async (response) => {
      toast.success(
        `${response.data.receipt_number} posted successfully.`
      );

      await onSuccess();
      onOpenChange(false);
    },

    onError: (error) => {
      toast.error(
        getApiErrorMessage(error) ||
          "The fee payment could not be posted."
      );
    },
  });

  const handleInvoiceChange = (invoiceId: string) => {
    onSelectedInvoiceIdChange(invoiceId);

    const invoice = invoices.find(
      (item) => item.id === invoiceId
    );

    setAmount(invoice?.due_amount ?? "");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!mutation.isPending) {
      onOpenChange(nextOpen);
    }
  };

  const getSelectedDueAmount = React.useCallback(() => {
    const due = Number(selectedInvoice?.due_amount ?? 0);

    return Number.isFinite(due) && due > 0
      ? due
      : 0;
  }, [selectedInvoice?.due_amount]);

  const sanitizePaymentAmount = React.useCallback(
    (rawValue: string) => {
      if (rawValue === "") {
        return "";
      }

      const parsedValue = Number(rawValue);

      if (!Number.isFinite(parsedValue)) {
        return amount;
      }

      const dueAmount = getSelectedDueAmount();

      if (parsedValue <= 0) {
        return "";
      }

      if (
        dueAmount > 0 &&
        parsedValue > dueAmount
      ) {
        return dueAmount.toFixed(2);
      }

      return rawValue;
    },
    [amount, getSelectedDueAmount]
  );

  const handleAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setAmount(
      sanitizePaymentAmount(event.target.value)
    );
  };

  const handleAmountKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      ["e", "E", "+", "-"].includes(event.key)
    ) {
      event.preventDefault();
    }
  };

  const handleAmountPaste = (
    event: React.ClipboardEvent<HTMLInputElement>
  ) => {
    const pastedValue =
      event.clipboardData.getData("text").trim();

    if (!pastedValue) {
      event.preventDefault();
      return;
    }

    const pastedNumber = Number(pastedValue);
    const dueAmount = getSelectedDueAmount();

    if (
      !Number.isFinite(pastedNumber) ||
      pastedNumber <= 0 ||
      (
        dueAmount > 0 &&
        pastedNumber > dueAmount
      )
    ) {
      event.preventDefault();
    }
  };

  const handleAmountWheel = (
    event: React.WheelEvent<HTMLInputElement>
  ) => {
    event.currentTarget.blur();
  };

  const requiresReference =
    paymentMethod !== "CASH";

  const numericAmount = Number(amount);

  const validAmount =
    Number.isFinite(numericAmount) &&
    numericAmount > 0;

  const selectedDueAmount =
    getSelectedDueAmount();

  const exceedsInvoiceDue =
    Boolean(selectedInvoice) &&
    numericAmount > selectedDueAmount;

  const canSubmit =
    validAmount &&
    Boolean(selectedInvoiceId) &&
    !exceedsInvoiceDue &&
    (
      !requiresReference ||
      Boolean(externalReference.trim())
    );

  const amountTooltip = selectedInvoice
    ? `Enter an amount between NPR 0.01 and ${formatMoney(
        selectedInvoice.due_amount,
        selectedInvoice.currency
      )}.`
    : "Select an invoice before entering the payment amount.";

  return (
    <TooltipProvider delayDuration={250}>
      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
      >
        <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-5xl">
          <DialogHeader className="border-b px-5 py-4 sm:px-6">
            <DialogTitle className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Banknote className="h-5 w-5" />
              </span>

              <TitleWithTooltip
                title="Record fee payment"
                tooltip="Review the selected invoice, then enter the amount and payment method. The receiving staff member and payment time are recorded automatically."
              />
            </DialogTitle>

            <DialogDescription className="sr-only">
              Record a payment against a selected student invoice.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(92vh-150px)] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
              <aside className="border-b bg-muted/15 p-5 lg:border-r lg:border-b-0 lg:p-6">
                <div className="lg:sticky lg:top-0">
                  <div className="mb-4">
                    <TitleWithTooltip
                      title="Selected invoice"
                      tooltip="Review the billing period and outstanding balance before recording payment."
                      size="sm"
                    />
                  </div>

                  <div className="mt-5">
                    {selectedInvoice ? (
                      <SelectedInvoiceSummary
                        invoice={selectedInvoice}
                        nepaliPeriod={
                          selectedNepaliBillingPeriod
                        }
                      />
                    ) : (
                      <div className="rounded-xl border border-dashed bg-background p-8 text-center">
                        <ReceiptText className="mx-auto h-8 w-8 text-muted-foreground/60" />

                        <p className="mt-3 text-sm font-medium">
                          No invoice selected
                        </p>

                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          Select an outstanding invoice
                          to view its billing and
                          payment summary.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    {selectedInvoice &&
                    validAmount &&
                    !exceedsInvoiceDue ? (
                      <PaymentPreview
                        amount={numericAmount}
                        dueAmount={
                          selectedDueAmount
                        }
                        currency={
                          selectedInvoice.currency
                        }
                      />
                    ) : null}
                  </div>
                </div>
              </aside>

              <section className="p-5 sm:p-6">
                <div className="space-y-5">
                  <TooltipField
                    label="Outstanding invoice"
                    tooltip="Choose the exact invoice receiving this payment."
                  >
                    <Select
                      value={selectedInvoiceId}
                      onValueChange={
                        handleInvoiceChange
                      }
                      disabled={mutation.isPending}
                    >
                      <SelectTrigger className="h-11 w-full bg-background">
                        <SelectValue placeholder="Select an outstanding invoice" />
                      </SelectTrigger>

                      <SelectContent>
                        {invoices.map((invoice) => {
                          const nepaliPeriod =
                            getNepaliBillingPeriod(
                              invoice.period_start,
                              invoice.period_end
                            );

                          return (
                            <SelectItem
                              key={invoice.id}
                              value={invoice.id}
                            >
                              <span className="flex min-w-0 flex-col">
                                <span className="truncate text-xs text-muted-foreground">
                                  {nepaliPeriod
                                    ? `${nepaliPeriod.month.label} ${nepaliPeriod.bsYear}`
                                    : `${formatDisplayDate(
                                        invoice.period_start
                                      )} – ${formatDisplayDate(
                                        invoice.period_end
                                      )}`}
                                  {" · Due "}
                                  {formatMoney(
                                    invoice.due_amount,
                                    invoice.currency
                                  )}
                                </span>
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </TooltipField>

                  <TooltipField
                    label="Amount received"
                    tooltip={amountTooltip}
                  >
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium text-muted-foreground">
                        NPR
                      </span>

                      <Input
                        className="h-11 pl-12 text-base font-semibold tabular-nums"
                        type="number"
                        min="0.01"
                        max={
                          selectedInvoice?.due_amount
                        }
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={amount}
                        disabled={
                          mutation.isPending ||
                          !selectedInvoice
                        }
                        onChange={
                          handleAmountChange
                        }
                        onKeyDown={
                          handleAmountKeyDown
                        }
                        onPaste={
                          handleAmountPaste
                        }
                        onWheel={
                          handleAmountWheel
                        }
                      />
                    </div>
                  </TooltipField>

                  {exceedsInvoiceDue ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                      The payment amount cannot
                      exceed the selected
                      invoice&apos;s remaining due
                      amount.
                    </div>
                  ) : null}

                  {!amount && selectedInvoice ? (
                    <p className="text-xs text-muted-foreground">
                      Enter at least NPR 0.01 to
                      record a payment.
                    </p>
                  ) : null}

                  <TooltipField
                    label="Payment method"
                    tooltip="Choose how this payment was received."
                  >
                    <Select
                      value={paymentMethod}
                      onValueChange={(value) => {
                        const method =
                          value as PaymentMethod;

                        setPaymentMethod(method);

                        if (method === "CASH") {
                          setExternalReference("");
                        }
                      }}
                      disabled={mutation.isPending}
                    >
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>

                      <SelectContent>
                        {PAYMENT_METHODS.map(
                          (item) => (
                            <SelectItem
                              key={item.value}
                              value={item.value}
                            >
                              <span className="flex items-center gap-2">
                                {item.value ===
                                "CASH" ? (
                                  <Banknote className="h-4 w-4" />
                                ) : (
                                  <CreditCard className="h-4 w-4" />
                                )}

                                {item.label}
                              </span>
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </TooltipField>

                  {requiresReference ? (
                    <TooltipField
                      label="Transaction reference"
                      tooltip="Required for bank, cheque, card, and digital payments."
                    >
                      <Input
                        className="h-11"
                        placeholder="Transaction ID or cheque number"
                        value={externalReference}
                        disabled={
                          mutation.isPending
                        }
                        onChange={(event) =>
                          setExternalReference(
                            event.target.value
                          )
                        }
                      />
                    </TooltipField>
                  ) : null}

                  <TooltipField
                    label="Payment note"
                    tooltip="Optional internal note for the finance team."
                  >
                    <Textarea
                      rows={4}
                      placeholder="Example: Cash received from guardian"
                      value={notes}
                      disabled={mutation.isPending}
                      onChange={(event) =>
                        setNotes(event.target.value)
                      }
                    />
                  </TooltipField>

                  <div className="rounded-xl border bg-muted/30 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                      <p className="text-xs leading-5 text-muted-foreground">
                        The current payment time,
                        receiving staff member, and
                        idempotency key are recorded
                        automatically. This payment is
                        applied only to the selected
                        invoice.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <DialogFooter className="border-t bg-background px-5 py-4 sm:px-6">
            <Button
              variant="outline"
              disabled={mutation.isPending}
              onClick={() =>
                handleOpenChange(false)
              }
            >
              Cancel
            </Button>

            <Button
              disabled={
                !canSubmit ||
                mutation.isPending
              }
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ReceiptText className="mr-2 h-4 w-4" />
              )}

              Record payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

function TitleWithTooltip({
  title,
  tooltip,
  size = "default",
}: {
  title: string;
  tooltip: string;
  size?: "default" | "sm";
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={
          size === "sm"
            ? "text-sm font-semibold"
            : "text-base font-semibold sm:text-lg"
        }
      >
        {title}
      </span>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`More information about ${title}`}
          >
            <CircleHelp className="h-4 w-4" />
          </button>
        </TooltipTrigger>

        <TooltipContent
          side="bottom"
          align="start"
          className="max-w-xs leading-5"
        >
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </span>
  );
}

function TooltipField({
  label,
  tooltip,
  children,
}: {
  label: string;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>{label}</Label>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`More information about ${label}`}
            >
              <CircleHelp className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>

          <TooltipContent
            side="top"
            align="start"
            className="max-w-xs leading-5"
          >
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </div>

      {children}
    </div>
  );
}

function SelectedInvoiceSummary({
  invoice,
  nepaliPeriod,
}: {
  invoice: FeeInvoice;
  nepaliPeriod: ReturnType<
    typeof getNepaliBillingPeriod
  >;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
      <div className="border-b p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Invoice
            </p>

            <p className="mt-1 font-semibold">
              {invoice.invoice_number}
            </p>
          </div>

          <div className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium">
            {invoice.status.replaceAll("_", " ")}
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <p className="text-xs text-muted-foreground">
            Billing period
          </p>

          {nepaliPeriod ? (
            <>
              <p className="mt-1 font-semibold">
                {nepaliPeriod.month.label}{" "}
                {nepaliPeriod.bsYear}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {formatDisplayDate(
                  invoice.period_start
                )}
                {" – "}
                {formatDisplayDate(
                  invoice.period_end
                )}
              </p>
            </>
          ) : (
            <p className="mt-1 font-medium">
              {formatDisplayDate(
                invoice.period_start
              )}
              {" – "}
              {formatDisplayDate(
                invoice.period_end
              )}
            </p>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <SummaryLine
            label="Invoice total"
            value={formatMoney(
              invoice.total_amount,
              invoice.currency
            )}
          />

          <SummaryLine
            label="Already paid"
            value={formatMoney(
              invoice.paid_amount,
              invoice.currency
            )}
          />
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
            Remaining due
          </p>

          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-300">
            {formatMoney(
              invoice.due_amount,
              invoice.currency
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">
        {label}
      </span>

      <span className="font-medium">
        {value}
      </span>
    </div>
  );
}

function PaymentPreview({
  amount,
  dueAmount,
  currency,
}: {
  amount: number;
  dueAmount: number;
  currency: string;
}) {
  const remainingAfter = Math.max(
    dueAmount - amount,
    0
  );

  const isFullPayment =
    Math.abs(amount - dueAmount) < 0.001;

  return (
    <div
      className={
        isFullPayment
          ? "rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30"
          : "rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/30"
      }
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">
            {isFullPayment
              ? "Full payment"
              : "Partial payment"}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Remaining balance after this payment
          </p>
        </div>

        <p className="text-lg font-bold tabular-nums">
          {formatMoney(
            remainingAfter,
            currency
          )}
        </p>
      </div>
    </div>
  );
}
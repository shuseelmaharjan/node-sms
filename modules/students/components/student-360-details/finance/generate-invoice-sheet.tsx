"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  FilePlus2,
  Info,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import { studentFinanceApi } from "../../../apis/student-finance.api";
import {
  NEPALI_MONTHS,
  type NepaliMonthValue,
} from "./constants";
import { Field } from "./shared";
import {
  createBillingYearOptions,
  getNepaliMonthDateRange,
} from "./utils";

export function GenerateInvoiceSheet({
  open,
  onOpenChange,
  enrollmentId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollmentId: string;
  onSuccess: () => Promise<void>;
}) {
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] =
    React.useState<NepaliMonthValue>("BAISAKH");
  const [billingYear, setBillingYear] = React.useState(String(currentYear));
  const [notes, setNotes] = React.useState("");

  const billingYears = React.useMemo(createBillingYearOptions, []);

  const selectedRange = React.useMemo(
    () => getNepaliMonthDateRange(selectedMonth, Number(billingYear)),
    [selectedMonth, billingYear]
  );

  React.useEffect(() => {
    if (!open) return;
    setNotes(
      `${selectedRange.month.label} fee for billing year ${billingYear}`
    );
  }, [open, selectedRange.month.label, billingYear]);

  const mutation = useMutation({
    mutationFn: () =>
      studentFinanceApi.generateInvoice({
        enrollment_id: enrollmentId,
        period_start: selectedRange.periodStart,
        period_end: selectedRange.periodEnd,
        notes: notes.trim(),
      }),
    onSuccess: async (invoice) => {
      toast.success(`Bill ${invoice.invoice_number} generated successfully.`);
      await onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error) ||
          "The student bill could not be generated."
      );
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!mutation.isPending) onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarRange className="h-5 w-5" />
            </span>
            <span>Generate student bill</span>
          </SheetTitle>
          <SheetDescription className="leading-5">
            Select the Nepali month and billing year. The system calculates
            the English date range automatically.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-6">
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Select the fee period</p>
                <p className="text-xs leading-5 text-muted-foreground">
                  The selected Nepali month is converted into the configured
                  English billing range used by the fee API.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Nepali billing month"
              description="Choose the month for which the student is being billed."
            >
              <Select
                value={selectedMonth}
                onValueChange={(value) =>
                  setSelectedMonth(value as NepaliMonthValue)
                }
                disabled={mutation.isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Nepali month" />
                </SelectTrigger>
                <SelectContent>
                  {NEPALI_MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Billing year (AD)"
              description="Select the English year containing this billing period."
            >
              <Select
                value={billingYear}
                onValueChange={setBillingYear}
                disabled={mutation.isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select billing year" />
                </SelectTrigger>
                <SelectContent>
                  {billingYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="overflow-hidden rounded-xl border">
            <div className="border-b bg-muted/40 px-4 py-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Bill preview</span>
              </div>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  Selected Nepali month
                </p>
                <p className="mt-1 font-semibold">
                  {selectedRange.month.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedRange.month.description}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <PreviewDate
                  label="Period starts"
                  value={selectedRange.periodStart}
                />
                <PreviewDate
                  label="Period ends"
                  value={selectedRange.periodEnd}
                />
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  Invoice date and due date are generated automatically from
                  the school&apos;s fee configuration.
                </span>
              </div>
            </div>
          </div>

          <Field
            label="Billing note"
            description="This note will be saved with the generated invoice."
          >
            <Textarea
              rows={4}
              placeholder="Example: Monthly fee for Baisakh"
              value={notes}
              disabled={mutation.isPending}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Field>
        </div>

        <SheetFooter className="border-t bg-background">
          <Button
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={mutation.isPending || !selectedMonth || !billingYear}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FilePlus2 className="mr-2 h-4 w-4" />
            )}
            Generate bill
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function PreviewDate({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium tabular-nums">{value}</p>
    </div>
  );
}

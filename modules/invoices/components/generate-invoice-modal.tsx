"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import {
  CalendarDays,
  CheckCircle2,
  FilePlus2,
  Info,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/api";
import { DatePickerField } from "@/components/fields/DatePickerField";
import { SelectField } from "@/components/fields/SelectField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { invoiceApi } from "../api/invoice.api";
import {
  bulkInvoiceSchema,
  type BulkInvoiceValues,
} from "../schema/invoice.schema";
import type { BulkGenerateInvoiceResponse } from "../types/invoice.types";
import {
  createBillingYearOptions,
  getNepaliMonthDateRange,
  NEPALI_MONTHS,
  type NepaliMonthValue,
} from "../utils/billing-period";

function today() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function createDefaults(): BulkInvoiceValues {
  const currentYear = String(new Date().getFullYear());
  const range = getNepaliMonthDateRange("BAISAKH", Number(currentYear));

  return {
    batch_id: "",
    academic_class_id: "__all__",
    section_id: "__all__",
    nepali_month: "BAISAKH",
    billing_year: currentYear,
    invoice_date: today(),
    due_date: today(),
    notes: `${range.month.label} fee for billing year ${currentYear}`,
  };
}

export function GenerateInvoiceModal(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated?: (result: BulkGenerateInvoiceResponse) => void;
}) {
  const queryClient = useQueryClient();
  const billingYears = React.useMemo(createBillingYearOptions, []);
  const methods = useForm<BulkInvoiceValues>({
    resolver: zodResolver(bulkInvoiceSchema),
    defaultValues: createDefaults(),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const batchId = methods.watch("batch_id");
  const classId = methods.watch("academic_class_id");
  const selectedMonth = methods.watch("nepali_month");
  const billingYear = methods.watch("billing_year");

  const selectedRange = React.useMemo(
    () => getNepaliMonthDateRange(selectedMonth, Number(billingYear)),
    [selectedMonth, billingYear]
  );

  React.useEffect(() => {
    if (!props.open) return;
    methods.reset(createDefaults());
  }, [props.open, methods]);

  React.useEffect(() => {
    if (!props.open) return;
    methods.setValue(
      "notes",
      `${selectedRange.month.label} fee for billing year ${billingYear}`,
      { shouldDirty: true, shouldValidate: true }
    );
  }, [billingYear, methods, props.open, selectedRange.month.label]);

  React.useEffect(() => {
    methods.setValue("academic_class_id", "__all__", {
      shouldDirty: Boolean(batchId),
      shouldValidate: true,
    });
    methods.setValue("section_id", "__all__", {
      shouldDirty: Boolean(batchId),
      shouldValidate: true,
    });
  }, [batchId, methods]);

  React.useEffect(() => {
    methods.setValue("section_id", "__all__", {
      shouldDirty: classId !== "__all__",
      shouldValidate: true,
    });
  }, [classId, methods]);

  const batchesQuery = useQuery({
    queryKey: ["invoice", "options", "batches"],
    queryFn: invoiceApi.listBatches,
    enabled: props.open,
  });

  const classesQuery = useQuery({
    queryKey: ["invoice", "options", "classes", batchId],
    queryFn: () => invoiceApi.listClasses(Number(batchId)),
    enabled: props.open && Boolean(batchId),
  });

  const sectionsQuery = useQuery({
    queryKey: ["invoice", "options", "sections", classId],
    queryFn: () => invoiceApi.listSections(classId),
    enabled: props.open && Boolean(classId) && classId !== "__all__",
  });

  const mutation = useMutation({
    mutationFn: async (values: BulkInvoiceValues) => {
      const range = getNepaliMonthDateRange(
        values.nepali_month,
        Number(values.billing_year)
      );

      return invoiceApi.generateBulk({
        batch_id: Number(values.batch_id),
        academic_class_id:
          values.academic_class_id === "__all__"
            ? undefined
            : values.academic_class_id,
        section_id:
          values.section_id === "__all__" ? null : values.section_id,
        period_start: range.periodStart,
        period_end: range.periodEnd,
        invoice_date: values.invoice_date,
        due_date: values.due_date,
        notes: (values.notes ?? "").trim(),
      });
    },
    onSuccess: async (result) => {
      const createdInvoiceIds = result.data
        .filter((item) => item.created && item.invoice?.id)
        .map((item) => item.invoice!.id);

      await queryClient.invalidateQueries({ queryKey: ["invoice", "list"] });
      props.onGenerated?.(result);

      if (createdInvoiceIds.length > 0) {
        try {
          await invoiceApi.downloadBulk(
            createdInvoiceIds,
            `generated-fee-invoices-${selectedRange.periodStart}-to-${selectedRange.periodEnd}.pdf`
          );
          toast.success(
            `${createdInvoiceIds.length} invoice${createdInvoiceIds.length === 1 ? "" : "s"} generated and PDF downloaded.`
          );
        } catch (error) {
          toast.error(
            `Invoices were generated, but the PDF could not be downloaded. ${getApiErrorMessage(error)}`
          );
        }
      } else {
        toast.success(
          `No new invoices were created. ${result.summary.existing_count} existing invoice${
            result.summary.existing_count === 1 ? " was" : "s were"
          } returned.`
        );
      }

      props.onOpenChange(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const batchOptions = (batchesQuery.data ?? []).map((item) => ({
    value: String(item.id),
    label: item.name,
  }));
  const classOptions = [
    { value: "__all__", label: "All classes" },
    ...(classesQuery.data ?? []).map((item) => ({ value: item.id, label: item.name })),
  ];
  const sectionOptions = [
    { value: "__all__", label: "All sections / no section" },
    ...(sectionsQuery.data ?? []).map((item) => ({ value: item.id, label: item.name })),
  ];

  const handleOpenChange = (nextOpen: boolean) => {
    if (!mutation.isPending) props.onOpenChange(nextOpen);
  };

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Generate bulk invoices</DialogTitle>
          <DialogDescription>
            Choose the invoice scope and Nepali billing period. The English date range is calculated automatically.
          </DialogDescription>
        </DialogHeader>

        <Form {...methods}>
          <form
            id="bulk-invoice-form"
            className="space-y-6"
            onSubmit={methods.handleSubmit((values) => mutation.mutateAsync(values))}
          >
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="mb-4">
                <h3 className="text-sm font-semibold">Invoice scope</h3>
                <p className="text-xs text-muted-foreground">
                  Batch is required. Class and section can be used to narrow the selected students.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <SelectField
                  control={methods.control}
                  name="batch_id"
                  label="Batch"
                  required
                  options={batchOptions}
                  disabled={mutation.isPending || batchesQuery.isLoading}
                  placeholder="Select batch"
                />
                <SelectField
                  control={methods.control}
                  name="academic_class_id"
                  label="Class"
                  options={classOptions}
                  disabled={mutation.isPending || !batchId || classesQuery.isLoading}
                  placeholder="All classes"
                />
                <SelectField
                  control={methods.control}
                  name="section_id"
                  label="Section"
                  options={sectionOptions}
                  disabled={
                    mutation.isPending ||
                    !classId ||
                    classId === "__all__" ||
                    sectionsQuery.isLoading
                  }
                  placeholder="All sections"
                />
              </div>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Select the fee period</p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    The selected Nepali month is converted into the English billing range used by the fee API.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Nepali billing month"
                description="Choose the month for which students are being billed."
              >
                <Controller
                  control={methods.control}
                  name="nepali_month"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value as NepaliMonthValue)}
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
                  )}
                />
              </Field>

              <Field
                label="Billing year (AD)"
                description="Select the English year containing this billing period."
              >
                <Controller
                  control={methods.control}
                  name="billing_year"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
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
                  )}
                />
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
                  <p className="text-xs text-muted-foreground">Selected Nepali month</p>
                  <p className="mt-1 font-semibold">{selectedRange.month.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedRange.month.description}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <PreviewDate label="Period starts" value={selectedRange.periodStart} />
                  <PreviewDate label="Period ends" value={selectedRange.periodEnd} />
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    The period is generated automatically. Invoice and due dates remain editable below.
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <DatePickerField
                control={methods.control}
                name="invoice_date"
                label="Invoice date"
                required
                disabled={mutation.isPending}
              />
              <DatePickerField
                control={methods.control}
                name="due_date"
                label="Due date"
                required
                disabled={mutation.isPending}
              />
            </div>

            <Field
              label="Billing note"
              description="This note will be saved with every generated invoice."
              error={methods.formState.errors.notes?.message}
            >
              <Controller
                control={methods.control}
                name="notes"
                render={({ field }) => (
                  <Textarea
                    rows={4}
                    placeholder="Example: Baisakh monthly fee"
                    value={field.value ?? ""}
                    disabled={mutation.isPending}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
                  />
                )}
              />
            </Field>
          </form>
        </Form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="bulk-invoice-form"
            disabled={mutation.isPending || !methods.formState.isValid}
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FilePlus2 className="mr-2 h-4 w-4" />
            )}
            {mutation.isPending ? "Generating…" : "Generate invoices"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  description,
  error,
  children,
}: {
  label: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {description ? (
          <div className="text-xs text-muted-foreground">{description}</div>
        ) : null}
      </div>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
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

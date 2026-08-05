"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";

import { Badge, normalizeVariant } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RowActionsDropdown } from "@/components/data-table/RowActionsDropdown";
import { formatDateShort, toSentenceCase } from "@/utils/text-utils";
import type { InvoiceRecord } from "../types/invoice.types";

const NEPALI_MONTHS = [
  "Baisakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
] as const;

function money(
  value: string | number | null | undefined
) {
  const number = Number(value ?? 0);

  return Number.isFinite(number)
    ? number.toLocaleString("en-NP", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    : "0.00";
}

/**
 * Maps an AD period start date to the Nepali billing month.
 *
 * This follows the same fixed month boundaries normally used by the
 * invoice-generation form:
 *
 * Baisakh  -> April 14
 * Jestha   -> May 15
 * Ashadh   -> June 15
 * Shrawan  -> July 17
 * Bhadra   -> August 17
 * Ashwin   -> September 17
 * Kartik   -> October 18
 * Mangsir  -> November 17
 * Poush    -> December 16
 * Magh     -> January 15
 * Falgun   -> February 13
 * Chaitra  -> March 14
 */
function getNepaliBillingMonth(
  periodStart: string | null | undefined
): string {
  if (!periodStart) {
    return "—";
  }

  const date = new Date(`${periodStart}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (
    (month === 4 && day >= 14) ||
    (month === 5 && day < 15)
  ) {
    return NEPALI_MONTHS[0];
  }

  if (
    (month === 5 && day >= 15) ||
    (month === 6 && day < 15)
  ) {
    return NEPALI_MONTHS[1];
  }

  if (
    (month === 6 && day >= 15) ||
    (month === 7 && day < 17)
  ) {
    return NEPALI_MONTHS[2];
  }

  if (
    (month === 7 && day >= 17) ||
    (month === 8 && day < 17)
  ) {
    return NEPALI_MONTHS[3];
  }

  if (
    (month === 8 && day >= 17) ||
    (month === 9 && day < 17)
  ) {
    return NEPALI_MONTHS[4];
  }

  if (
    (month === 9 && day >= 17) ||
    (month === 10 && day < 18)
  ) {
    return NEPALI_MONTHS[5];
  }

  if (
    (month === 10 && day >= 18) ||
    (month === 11 && day < 17)
  ) {
    return NEPALI_MONTHS[6];
  }

  if (
    (month === 11 && day >= 17) ||
    (month === 12 && day < 16)
  ) {
    return NEPALI_MONTHS[7];
  }

  if (
    (month === 12 && day >= 16) ||
    (month === 1 && day < 15)
  ) {
    return NEPALI_MONTHS[8];
  }

  if (
    (month === 1 && day >= 15) ||
    (month === 2 && day < 13)
  ) {
    return NEPALI_MONTHS[9];
  }

  if (
    (month === 2 && day >= 13) ||
    (month === 3 && day < 14)
  ) {
    return NEPALI_MONTHS[10];
  }

  if (
    (month === 3 && day >= 14) ||
    (month === 4 && day < 14)
  ) {
    return NEPALI_MONTHS[11];
  }

  return "—";
}

function getBillingYear(
  periodStart: string | null | undefined
): number | string {
  if (!periodStart) {
    return "—";
  }

  const date = new Date(`${periodStart}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.getFullYear();
}

export function invoiceColumns(args: {
  rows: InvoiceRecord[];
  selectedIds: Set<string>;
  onToggleRow: (
    invoiceId: string,
    checked: boolean
  ) => void;
  onTogglePage: (checked: boolean) => void;
  onDownload: (
    invoice: InvoiceRecord
  ) => void | Promise<void>;
  downloadingId?: string | null;
}): ColumnDef<InvoiceRecord>[] {
  const pageIds = args.rows.map(
    (row) => row.id
  );

  const selectedOnPage = pageIds.filter(
    (id) => args.selectedIds.has(id)
  ).length;

  const allPageSelected =
    pageIds.length > 0 &&
    selectedOnPage === pageIds.length;

  const somePageSelected =
    selectedOnPage > 0 &&
    !allPageSelected;

  return [
    {
      id: "select",
      header: () => (
        <Checkbox
          checked={
            allPageSelected
              ? true
              : somePageSelected
                ? "indeterminate"
                : false
          }
          onCheckedChange={(checked) =>
            args.onTogglePage(Boolean(checked))
          }
          aria-label="Select all invoices on this page"
        />
      ),
      enableSorting: false,
      cell: ({ row }) => (
        <Checkbox
          checked={args.selectedIds.has(
            row.original.id
          )}
          onCheckedChange={(checked) =>
            args.onToggleRow(
              row.original.id,
              Boolean(checked)
            )
          }
          onClick={(event) =>
            event.stopPropagation()
          }
          aria-label={`Select invoice ${row.original.invoice_number}`}
        />
      ),
    },

    {
      accessorKey: "serial",
      header: "#",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="tabular-nums">
          {row.original.serial ??
            row.index + 1}
          .
        </span>
      ),
    },

    {
      accessorKey: "invoice_number",
      header: "Invoice",
      cell: ({ row }) => (
        <div className="min-w-[150px]">
          <div className="font-medium">
            {row.original.invoice_number}
          </div>

          <div className="text-xs text-muted-foreground">
            {formatDateShort(
              row.original.invoice_date
            )}
          </div>
        </div>
      ),
    },

    {
      id: "student",
      header: "Student",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="min-w-[190px]">
          <div className="font-medium">
            {row.original.student_detail
              ?.full_name || "Student"}
          </div>

          <div className="text-xs text-muted-foreground">
            {row.original.student_detail
              ?.registration_no ||
              "No registration number"}
          </div>
        </div>
      ),
    },

    {
      id: "scope",
      header: "Class / Section",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="min-w-[150px]">
          <div>
            {row.original.class_name ||
              "—"}
          </div>

          <div className="text-xs text-muted-foreground">
            {row.original.section_name ||
              "No section"}
          </div>
        </div>
      ),
    },

    {
      id: "period",
      header: "Billing Period",
      enableSorting: false,
      cell: ({ row }) => {
        const nepaliMonth =
          getNepaliBillingMonth(
            row.original.period_start
          );
        const billingYear = getBillingYear(
          row.original.period_start
        );

        return (
          <div className="min-w-[190px]">
            <div className="font-medium">
              {nepaliMonth} {billingYear}
            </div>

            <div className="whitespace-nowrap text-xs text-muted-foreground">
              {formatDateShort(
                row.original.period_start
              )}{" "}
              —{" "}
              {formatDateShort(
                row.original.period_end
              )}
            </div>
          </div>
        );
      },
    },

    {
      accessorKey: "total_amount",
      header: "Total",
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {row.original.currency}{" "}
          {money(
            row.original.total_amount
          )}
        </span>
      ),
    },

    {
      accessorKey: "due_amount",
      header: "Due",
      cell: ({ row }) => (
        <span className="whitespace-nowrap font-medium tabular-nums">
          {row.original.currency}{" "}
          {money(
            row.original.due_amount
          )}
        </span>
      ),
    },

    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => (
        <Badge
          variant={normalizeVariant(
            row.original.status
          )}
          label={toSentenceCase(
            row.original.status
          )}
        />
      ),
    },

    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <RowActionsDropdown
          row={row.original}
          showLabel={false}
          items={[
            {
              key: "download",
              label: "Download PDF",
              icon: (
                <Download className="h-4 w-4" />
              ),
              disabled:
                args.downloadingId ===
                row.original.id,
              onSelect: args.onDownload,
            },
          ]}
        />
      ),
    },
  ];
}
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Download, ExternalLink } from "lucide-react";

import { Badge, normalizeVariant } from "@/components/ui/badge";
import { RowActionsDropdown } from "@/components/data-table/RowActionsDropdown";
import { formatDateTime, toSentenceCase } from "@/utils/text-utils";

import type { BillingRecord } from "../types/billing.types";

function money(value: string | number | null | undefined): string {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount)
    ? amount.toLocaleString("en-NP", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";
}

export function billingColumns(args: {
  downloadingId: string | null;
  onDownload: (record: BillingRecord) => void | Promise<void>;
}): ColumnDef<BillingRecord>[] {
  return [
    {
      accessorKey: "receipt_number",
      header: "Receipt",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="min-w-[155px]">
          <div className="font-medium">{row.original.receipt_number}</div>
          <div className="text-xs text-muted-foreground">
            {formatDateTime(row.original.paid_at)}
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
            {row.original.student_detail?.full_name || "Student"}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.original.student_detail?.registration_no || "No registration number"}
          </div>
        </div>
      ),
    },
    {
      id: "scope",
      header: "Batch / Class",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="min-w-[170px]">
          <div>{row.original.batch_name || `Batch ${row.original.batch}`}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.class_name || "—"}
            {row.original.section_name ? ` / ${row.original.section_name}` : ""}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Paid Amount",
      cell: ({ row }) => (
        <span className="whitespace-nowrap font-medium tabular-nums">
          {row.original.currency} {money(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: "payment_method",
      header: "Method",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="min-w-[120px]">
          <div>{toSentenceCase(row.original.payment_method)}</div>
          {row.original.external_reference ? (
            <div className="max-w-[170px] truncate text-xs text-muted-foreground">
              Ref: {row.original.external_reference}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "before_payment_due",
      header: "Before Due",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {row.original.currency} {money(row.original.before_payment_due)}
        </span>
      ),
    },
    {
      accessorKey: "after_payment_due",
      header: "After Due",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="whitespace-nowrap font-medium tabular-nums">
          {row.original.currency} {money(row.original.after_payment_due)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => (
        <Badge
          variant={normalizeVariant(row.original.status)}
          label={toSentenceCase(row.original.status)}
        />
      ),
    },
    {
      id: "received_by",
      header: "Received By",
      enableSorting: false,
      cell: ({ row }) => row.original.received_by_name || "—",
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
              key: "student",
              label: "Open student account",
              icon: <ExternalLink className="h-4 w-4" />,
              href: (record) => `/students/${record.student}`,
            },
            {
              key: "receipt",
              label:
                args.downloadingId === row.original.id
                  ? "Preparing receipt…"
                  : "Download receipt",
              icon: <Download className="h-4 w-4" />,
              disabled: args.downloadingId === row.original.id,
              onSelect: args.onDownload,
            },
          ]}
        />
      ),
    },
  ];
}

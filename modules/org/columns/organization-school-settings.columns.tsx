"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/text-utils";

export type SchoolSettingsEntity = {
  id: string;
  serial?: number;
  school: string;
  school_name?: string;

  invoice_prefix: string;
  receipt_prefix: string;
  fiscal_year_label: string;
  late_fee_fixed: string;
  late_fee_percent: string;

  is_active: boolean;
  updated_at: string;
};

export function organizationSchoolSettingsColumns(args: {
  onEdit: (row: SchoolSettingsEntity) => void;
  onDelete: (row: SchoolSettingsEntity) => void;
}): ColumnDef<SchoolSettingsEntity>[] {
  return [
    // serial
    {
      accessorKey: "serial",
      header: "#",
      enableSorting: false,
      cell: ({ row }) => <span className="tabular-nums">{row.original.serial ?? "-"}.</span>,
    },
    {
      accessorKey: "school_name",
      header: "School",
      enableSorting: true,
      cell: ({ row }) => row.original.school_name ?? row.original.school ?? "-",
    },
    {
      accessorKey: "invoice_prefix",
      header: "Invoice Prefix",
      enableSorting: false,
      cell: ({ row }) => row.original.invoice_prefix || "-",
    },
    {
      accessorKey: "receipt_prefix",
      header: "Receipt Prefix",
      enableSorting: false,
      cell: ({ row }) => row.original.receipt_prefix || "-",
    },
    {
      accessorKey: "fiscal_year_label",
      header: "Fiscal Year",
      enableSorting: false,
      cell: ({ row }) => row.original.fiscal_year_label || "-",
    },
    {
      accessorKey: "late_fee_fixed",
      header: "Late Fee (Fixed)",
      enableSorting: false,
      cell: ({ row }) => row.original.late_fee_fixed || "-",
    },
    {
      accessorKey: "late_fee_percent",
      header: "Late Fee (%)",
      enableSorting: false,
      cell: ({ row }) => row.original.late_fee_percent || "-",
    },
    {
      accessorKey: "is_active",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        const active = Boolean(row.original.is_active);
        return (
          <Badge variant={active ? "active" : "inactive"}>
            {active ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "updated_at",
      header: "Updated",
      enableSorting: true,
      cell: ({ row }) => {
        const v = row.original.updated_at;
        return v ? formatDateShort(v) : "-";
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => args.onEdit(row.original)}
          >
            Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => args.onDelete(row.original)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];
}

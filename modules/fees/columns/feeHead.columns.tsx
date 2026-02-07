// modules/fees/columns/feeHead.columns.tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/text-utils";

export type FeeHeadEntity = {
  serial?: number;
  id: string;
  name: string;
  code: string;
  group: "ONE_TIME" | "MONTHLY" | "ANNUAL" | string; // keep flexible
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function feeHeadColumns(args: {
  onEdit: (row: FeeHeadEntity) => void;
  onDelete: (row: FeeHeadEntity) => void;
}): ColumnDef<FeeHeadEntity>[] {
  return [
    {
      accessorKey: "serial",
      header: "#",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.serial ?? "-"}.</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium max-w-[240px] truncate">{row.original.name}</span>
          <span className="text-xs text-muted-foreground max-w-[240px] truncate">
            {row.original.code}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "group",
      header: "Group",
      enableSorting: true,
      cell: ({ row }) => <span className="whitespace-nowrap">{row.original.group}</span>,
    },
    {
      accessorKey: "description",
      header: "Description",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="max-w-[320px] truncate">
          {row.original.description || "-"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      enableSorting: true,
      accessorFn: (row) => row.is_active,
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "active" : "inactive"}>
          {row.original.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      enableSorting: true,
      cell: ({ row }) => <span>{formatDateShort(row.original.created_at)}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => args.onEdit(item)}>
              Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={() => args.onDelete(item)}>
              Delete
            </Button>
          </div>
        );
      },
    },
  ];
}

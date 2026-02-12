"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateShort } from "@/lib/text-utils";

type SchoolDetail = { id: string; name: string; code: string };

type FeesDetail = {
  id: string;
  amount?: string;
  currency?: string;
  period?: string;
  status?: string;
  scope?: string;
  created_at?: string;
};

export type EcaActivityEntity = {
  serial?: number;
  id: string;

  name: string;
  description: string;

  school: string;
  fees: string | null;

  school_detail?: SchoolDetail | null;
  fees_detail?: FeesDetail | null;

  status: "active" | "inactive" | "archived" | "deleted" | string;

  created_at: string;
  updated_at: string;
};

export function ecaActivityColumns(args: {
  onEdit: (row: EcaActivityEntity) => void;
  onDelete: (row: EcaActivityEntity) => void;
}): ColumnDef<EcaActivityEntity>[] {
  return [
    {
      accessorKey: "serial",
      header: "#",
      enableSorting: false,
      cell: ({ row }) => <span className="tabular-nums">{row.original.serial ?? "-"}.</span>,
    },
    {
      accessorKey: "name",
      header: "Activity",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium max-w-[260px] truncate">{row.original.name}</span>
          <span className="text-xs text-muted-foreground max-w-[320px] truncate">
            {row.original.description || "-"}
          </span>
        </div>
      ),
    },
    {
      id: "fees",
      header: "Fee Structure",
      enableSorting: false,
      cell: ({ row }) => {
        const f = row.original.fees_detail;
        if (!row.original.fees) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex flex-col">
            <span className="text-sm">
              {f?.amount ?? "-"} {f?.currency ?? ""}
            </span>
            <span className="text-xs text-muted-foreground">
              {f?.period ?? ""} {f?.scope ? `• ${f.scope}` : ""}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant={row.original.status === "active" ? "active" : "inactive"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created",
      enableSorting: true,
      cell: ({ row }) => <span>{formatDateShort(row.original.created_at)}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
        const canModify = item.status === "active";
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!canModify}
              onClick={() => canModify && args.onEdit(item)}
              className={!canModify ? "cursor-not-allowed opacity-60" : ""}
              title={!canModify ? "Only ACTIVE records can be updated." : "Edit"}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={!canModify}
              onClick={() => canModify && args.onDelete(item)}
              className={!canModify ? "cursor-not-allowed opacity-60" : ""}
              title={!canModify ? "Only ACTIVE records can be deleted." : "Delete"}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];
}

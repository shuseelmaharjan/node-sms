// modules/academics/columns/batch.columns.tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/text-utils";
import { format } from "path";

export type BatchEntity = {
  serial?: number;
  id: number;
  name: string;
  start_date_bs: string;
  start_date_ad: string;
  end_date_bs: string;
  end_date_ad: string;
  is_active: boolean;
  school: string;
  created_at: string;
  updated_at: string;
};

// Date validation utilities for list actions
const getCurrentDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
  ).padStart(2, "0")}`;
};

const isDateInFuture = (dateAd: string) => {
  if (!dateAd) return false;
  const currentDate = getCurrentDate();
  return dateAd > currentDate;
};

const isCurrentDateBetween = (startDateAd: string, endDateAd: string) => {
  if (!startDateAd || !endDateAd) return false;
  const currentDate = getCurrentDate();
  return currentDate >= startDateAd && currentDate <= endDateAd;
};

const hasDateExpired = (dateAd: string) => {
  if (!dateAd) return false;
  const currentDate = getCurrentDate();
  return dateAd < currentDate;
};

const canEditBatch = (batch: BatchEntity) => {
  const startInFuture = isDateInFuture(batch.start_date_ad);
  const isCurrentlyActive = isCurrentDateBetween(batch.start_date_ad, batch.end_date_ad);
  const hasExpired = hasDateExpired(batch.end_date_ad);
  
  return startInFuture || isCurrentlyActive || (hasExpired && batch.is_active);
};

const canDeleteBatch = (batch: BatchEntity) => {
  const startInFuture = isDateInFuture(batch.start_date_ad);
  return startInFuture; // Only allow deletion for future batches
};

export function batchColumns(args: {
  onEdit: (row: BatchEntity) => void;
  onDelete: (row: BatchEntity) => void;
}): ColumnDef<BatchEntity>[] {
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
      header: "Batch",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium max-w-[220px] truncate">{row.original.name}</span>
          {/* <span className="text-xs text-muted-foreground">
            {row.original.start_date_bs} → {row.original.end_date_bs}
          </span> */}
        </div>
      ),
    },
    {
      accessorKey: "start_date_bs",
      header: "Start Date (BS)",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col justify-center">
          <span>{row.original.start_date_bs}</span>
          <span className="text-xs text-muted-foreground">
            {formatDateShort(row.original.start_date_ad)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "end_date_bs",
      header: "End Date (BS)",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col justify-center">
          <span>{row.original.end_date_bs}</span>
          <span className="text-xs text-muted-foreground">
            {formatDateShort(row.original.end_date_ad)}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      enableSorting: false,
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
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{formatDateShort(row.original.created_at)}</span>
          
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const batch = row.original;
        const canEdit = canEditBatch(batch);
        const canDelete = canDeleteBatch(batch);
        
        return (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => args.onEdit(batch)}
              disabled={!canEdit}
              title={!canEdit ? "Cannot edit batch due to date restrictions" : "Edit batch"}
            >
              Edit
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => args.onDelete(batch)}
              disabled={!canDelete}
              title={!canDelete ? "Can only delete future batches" : "Delete batch"}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];
}

"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import {
  RowActionsDropdown,
  type RowActionItem,
} from "@/components/data-table/RowActionsDropdown";
import { formatRelative } from "@/utils/text-utils";

export type CareerEntity = {
  id: string;
  serial?: number;
  title: string;
  position: string;
  expires_at: string;
  updated_at?: string;
};

export function careersColumns(args: {
  onEdit: (row: CareerEntity) => void;
  onDelete: (row: CareerEntity) => void;
}): ColumnDef<CareerEntity>[] {
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
      accessorKey: "title",
      header: "Job",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.title}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.position}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "expires_at",
      header: "Expires",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatRelative(row.original.expires_at)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;

        const actions: RowActionItem<CareerEntity>[] = [
          {
            key: "edit",
            label: "Edit",
            icon: <Pencil className="h-4 w-4" />,
            onSelect: args.onEdit,
          },
          {
            key: "delete",
            label: "Delete",
            icon: <Trash2 className="h-4 w-4" />,
            onSelect: args.onDelete,
            variant: "destructive",
            separatorBefore: true,
          },
        ];

        return <RowActionsDropdown row={item} items={actions} />;
      },
    },
  ];
}
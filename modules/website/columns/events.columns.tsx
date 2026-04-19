"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import {
  RowActionsDropdown,
  type RowActionItem,
} from "@/components/data-table/RowActionsDropdown";

export type EventEntity = {
  id: string;
  serial?: number;
  title: string;
  description?: string;
  event_date: string;
  updated_at?: string;
};

export function eventsColumns(args: {
  onEdit: (row: EventEntity) => void;
  onDelete: (row: EventEntity) => void;
}): ColumnDef<EventEntity>[] {
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
      header: "Event",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.title}</div>
        </div>
      ),
    },
    {
      accessorKey: "event_date",
      header: "Event Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.event_date).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "updated_at",
      header: "Updated",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.updated_at
            ? new Date(row.original.updated_at).toLocaleString()
            : "-"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;

        const actions: RowActionItem<EventEntity>[] = [
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
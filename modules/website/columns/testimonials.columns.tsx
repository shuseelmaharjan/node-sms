"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import {
  RowActionsDropdown,
  type RowActionItem,
} from "@/components/data-table/RowActionsDropdown";
import { formatDateShort } from "@/utils/text-utils";

export type UploadedImageEntity = {
  id: string;
  file_url: string;
};

export type TestimonialEntity = {
  id: string;
  serial?: number;
  name: string;
  role?: string;
  message?: string;
  image?: UploadedImageEntity | null;
  updated_at?: string;
};

export function testimonialsColumns(args: {
  onEdit: (row: TestimonialEntity) => void;
  onDelete: (row: TestimonialEntity) => void;
}): ColumnDef<TestimonialEntity>[] {
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
      id: "name",
      header: "User",
      accessorFn: (row) => row.name,
      cell: ({ row }) => {
        const item = row.original;

        return (
          <div className="flex items-center gap-3 min-w-[260px]">
            <div className="h-12 w-12 rounded-full overflow-hidden border bg-muted">
              {item.image?.file_url ? (
                <img
                  src={item.image.file_url}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                  No
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="font-medium truncate">{item.name}</div>
              <div className="text-sm text-muted-foreground">
                {item.role || "-"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "message",
      header: "Message",
      enableSorting: false,
      accessorFn: (row) => row.message,
      cell: ({ row }) => (
        <span className="line-clamp-2 text-sm text-muted-foreground max-w-[400px]">
          {row.original.message?.trim() || "-"}
        </span>
      ),
    },
    {
      id: "updated_at",
      header: "Updated",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateShort(row.original.updated_at) ?? "-"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;

        const actions: RowActionItem<TestimonialEntity>[] = [
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
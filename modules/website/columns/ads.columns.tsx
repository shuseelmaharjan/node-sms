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
  download_url?: string;
  file_type: string;
  original_name?: string;
  size_bytes?: number;
  is_temporary?: boolean;
  meta?: any;
  uploaded_at?: string;
};

export type AdEntity = {
  id: string;
  serial?: number;
  title: string;
  description?: string;
  image?: UploadedImageEntity | null;
  link_url?: string;
  school_id?: string;
  created_at?: string;
  created_by_id?: string;
  updated_at?: string;
  updated_by_id?: string;
};

export function adsColumns(args: {
  onEdit: (row: AdEntity) => void;
  onDelete: (row: AdEntity) => void;
}): ColumnDef<AdEntity>[] {
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
      id: "title",
      header: "Ad",
      enableSorting: true,
      accessorFn: (row) => row.title,
      cell: ({ row }) => {
        const item = row.original;

        return (
          <div className="flex min-w-[280px] items-center gap-3">
            <div className="h-14 w-20 overflow-hidden rounded-lg border bg-muted">
              {item.image?.file_url ? (
                <img
                  src={item.image.file_url}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="truncate font-medium">{item.title}</div>
              <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {item.description?.trim() || "-"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "link_url",
      header: "Link URL",
      enableSorting: false,
      accessorFn: (row) => row.link_url,
      cell: ({ row }) => (
        <span className="block max-w-[280px] truncate text-sm text-muted-foreground">
          {row.original.link_url?.trim() || "-"}
        </span>
      ),
    },
    {
      id: "updated_at",
      header: "Updated",
      enableSorting: false,
      accessorFn: (row) => row.updated_at,
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

        const actions: RowActionItem<AdEntity>[] = [
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
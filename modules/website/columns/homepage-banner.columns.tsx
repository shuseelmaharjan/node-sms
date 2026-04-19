"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";

import {
  RowActionsDropdown,
  type RowActionItem,
} from "@/components/data-table/RowActionsDropdown";

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

export type HomepageBannerEntity = {
  id: string;
  serial?: number;
  title: string;
  subtitle?: string;
  description?: string;
  image?: UploadedImageEntity | null;
  sort_order?: number;
  have_link: boolean;
  link_url?: string;
  button_link?: string;
  school_id?: string;
  created_at?: string;
  created_by_id?: string;
  updated_at?: string;
  updated_by_id?: string;
};

function Pill(props: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs",
        props.active
          ? "border-primary/20 bg-primary/10 text-foreground"
          : "border-border bg-background text-muted-foreground",
      ].join(" ")}
    >
      {props.children}
    </span>
  );
}

export function homepageBannerColumns(args: {
  canMoveUp: (banner: HomepageBannerEntity) => boolean;
  canMoveDown: (banner: HomepageBannerEntity) => boolean;
  onEdit: (banner: HomepageBannerEntity) => void;
  onDelete: (banner: HomepageBannerEntity) => void;
  onMoveUp: (banner: HomepageBannerEntity) => void;
  onMoveDown: (banner: HomepageBannerEntity) => void;
}): ColumnDef<HomepageBannerEntity>[] {
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
      header: "Banner",
      enableSorting: true,
      accessorFn: (row) => row.title,
      cell: ({ row }) => {
        const item = row.original;

        return (
          <div className="flex min-w-[300px] items-center gap-3">
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
              {item.subtitle ? (
                <div className="truncate text-sm text-muted-foreground">
                  {item.subtitle}
                </div>
              ) : null}
              <div className="mt-1 flex flex-wrap gap-2">
                <Pill active={item.have_link}>
                  {item.have_link ? "Linked" : "No link"}
                </Pill>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "description",
      header: "Description",
      enableSorting: false,
      accessorFn: (row) => row.description,
      cell: ({ row }) => (
        <span className="line-clamp-2 max-w-[320px] text-sm text-muted-foreground">
          {row.original.description?.trim() || "-"}
        </span>
      ),
    },
    {
      id: "link_url",
      header: "Link URL",
      enableSorting: false,
      accessorFn: (row) => row.link_url,
      cell: ({ row }) => (
        <span className="max-w-[240px] truncate text-sm text-muted-foreground">
          {row.original.link_url?.trim() || "-"}
        </span>
      ),
    },
    {
      id: "button_link",
      header: "Button Label",
      enableSorting: false,
      accessorFn: (row) => row.button_link,
      cell: ({ row }) => (
        <span>{row.original.button_link?.trim() || "-"}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;

        const actions: RowActionItem<HomepageBannerEntity>[] = [
          {
            key: "edit",
            label: "Edit",
            icon: <Pencil className="h-4 w-4" />,
            onSelect: args.onEdit,
          },
          {
            key: "move-up",
            label: "Move up",
            icon: <ArrowUp className="h-4 w-4" />,
            onSelect: args.onMoveUp,
            disabled: !args.canMoveUp(item),
          },
          {
            key: "move-down",
            label: "Move down",
            icon: <ArrowDown className="h-4 w-4" />,
            onSelect: args.onMoveDown,
            disabled: !args.canMoveDown(item),
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
"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import {
  RowActionsDropdown,
  type RowActionItem,
} from "@/components/data-table/RowActionsDropdown";
import type { CourseEntity } from "../types/course.types";

function Pill(props: {
  children: React.ReactNode;
  active?: boolean;
  mono?: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs",
        props.mono ? "font-mono" : "",
        props.active
          ? "border-primary/20 bg-primary/10 text-foreground"
          : "border-border bg-background text-muted-foreground",
      ].join(" ")}
    >
      {props.children}
    </span>
  );
}

export function courseColumns(args: {
  canMoveUp: (course: CourseEntity) => boolean;
  canMoveDown: (course: CourseEntity) => boolean;
  onEdit: (course: CourseEntity) => void;
  onDelete: (course: CourseEntity) => void;
  onMoveUp: (course: CourseEntity) => void;
  onMoveDown: (course: CourseEntity) => void;
}): ColumnDef<CourseEntity>[] {
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
      header: "Course",
      enableSorting: true,
      accessorFn: (row) => row.name,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex min-w-[260px] items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-lg border bg-muted">
              {item.image?.file_url ? (
                <img
                  src={item.image.file_url}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="truncate font-medium">{item.name}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Pill mono>{item.slug}</Pill>
                {item.is_popular ? <Pill active>Popular</Pill> : null}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "navigation_name",
      header: "Navigation",
      enableSorting: true,
      accessorFn: (row) => row.navigation_name,
      cell: ({ row }) => <span>{row.original.navigation_name ?? "-"}</span>,
    },
    {
      id: "tags",
      header: "Tags",
      enableSorting: false,
      accessorFn: (row) => row.tags,
      cell: ({ row }) => {
        const tags = row.original.tags?.trim();
        return (
          <span className="text-sm text-muted-foreground">
            {tags || "-"}
          </span>
        );
      },
    },
    {
      id: "is_popular",
      header: "Popular",
      cell: ({ row }) => (
        <span>{row.original.is_popular ? "Yes" : "No"}</span>
      ),
    },
   
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;

        const actions: RowActionItem<CourseEntity>[] = [
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
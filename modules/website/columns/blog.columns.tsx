"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { RowActionsDropdown } from "@/components/data-table/RowActionsDropdown";
import type { BlogEntity } from "../types/blog.types";
import { formatDateShort } from "@/utils/text-utils";

export function blogColumns(args: {
    onEdit: (row: BlogEntity) => void;
    onDelete: (row: BlogEntity) => void;
}): ColumnDef<BlogEntity>[] {
    return [
        {
            accessorKey: "serial",
            header: "#",
            enableSorting: false,
            cell: ({ row }) => <span>{row.original.serial ?? "-"}</span>,
        },
        {
            accessorKey: "title",
            header: "Title",
            enableSorting: true,
        },
        {
            accessorKey: "author",
            header: "Author",
            enableSorting: false,
        },
        {
            accessorKey: "published_at",
            header: "Published",
            enableSorting: true,
            cell: ({ row }) =>
                formatDateShort(row.original.published_at) ?? "-",
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <RowActionsDropdown
                    row={row.original}
                    items={[
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
                        },
                    ]}
                />
            ),
        },
    ];
}
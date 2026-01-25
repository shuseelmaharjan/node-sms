"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import type { AdminListItem } from "../api/admins.api";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function adminsColumns(args: {
  onDelete: (row: AdminListItem) => void;
}): ColumnDef<AdminListItem>[] {
  return [
    {
      accessorKey: "serial",
      header: "#",
      enableSorting: false,
      cell: ({ row }) => <span className="tabular-nums">{row.original.serial ?? "-"}</span>,
    },
    {
      id: "name",
      header: "Name",
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="leading-tight">
            <div className="font-medium">
              {r.first_name} {r.middle_name ? `${r.middle_name} ` : ""}{r.last_name}
            </div>
            <div className="text-xs text-muted-foreground">@{r.username}</div>
          </div>
        );
      },
    },
    { accessorKey: "email", header: "Email", enableSorting: false },
    { accessorKey: "phone", header: "Phone", enableSorting: false },
    {
      accessorKey: "role",
      header: "Role",
      enableSorting: true,
      cell: ({ row }) => <Badge variant="secondary">{row.original.role}</Badge>,
    },
    {
      accessorKey: "profile_status",
      header: "Profile",
      enableSorting: true,
      cell: ({ row }) => (
        <Badge variant={row.original.profile_status === "complete" ? "default" : "outline"}>
          {row.original.profile_status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admins/${r.id}`} className="flex items-center gap-2">
                  <Eye className="h-4 w-4" /> View
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href={`/admins/create?tab=personal&userId=${r.id}`} className="flex items-center gap-2">
                  <Edit className="h-4 w-4" /> Edit
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="flex items-center gap-2 text-destructive"
                onClick={() => args.onDelete(r)}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

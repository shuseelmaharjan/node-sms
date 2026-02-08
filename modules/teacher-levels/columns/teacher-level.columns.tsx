"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export type TeacherLevelEntity = {
  serial?: number;
  id: string;
  level: string;
  status: "active" | "inactive" | "deleted";
  created_at?: string;
  updated_at?: string;
};

export function teacherLevelColumns(args: {
  blocked: boolean;
  onEdit: (row: TeacherLevelEntity) => void;
  onDelete: (row: TeacherLevelEntity) => void;
  onToggle: (row: TeacherLevelEntity, nextActive: boolean) => void;
}): ColumnDef<TeacherLevelEntity>[] {
  return [
    {
      accessorKey: "serial",
      header: "#",
      enableSorting: false,
      cell: ({ row }) => <span className="tabular-nums">{row.original.serial ?? "-"}.</span>,
    },
    {
      accessorKey: "level",
      header: "Level",
      enableSorting: true,
      cell: ({ row }) => <span className="font-medium">{row.original.level}</span>,
    },
    {
      id: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        const active = row.original.status === "active";
        const disabled = args.blocked || row.original.status === "deleted";
        return (
          <div className="flex items-center gap-3">
            <Badge variant={active ? "active" : "inactive"}>{active ? "Active" : "Inactive"}</Badge>
            <Switch checked={active} disabled={disabled} onCheckedChange={(v) => args.onToggle(row.original, Boolean(v))} />
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={args.blocked} onClick={() => args.onEdit(item)}>
              Edit
            </Button>
            <Button size="sm" variant="destructive" disabled={args.blocked} onClick={() => args.onDelete(item)}>
              Delete
            </Button>
          </div>
        );
      },
    },
  ];
}

"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import type { Schedule } from "../types/schedule.types";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function hhmm(v?: string | null) {
  if (!v) return "-";
  return v.slice(0, 5);
}

function kindLabel(kind: Schedule["kind"]) {
  if (kind === "class") return "Class";
  if (kind === "break") return "Break";
  return "Holiday";
}

export function scheduleColumns(args: {
  onEdit: (row: Schedule) => void;
  onDelete: (row: Schedule) => void;
}): ColumnDef<Schedule>[] {
  return [
    {
      accessorKey: "day_of_week",
      header: "Day",
      enableSorting: true,
      cell: ({ row }) => DAYS[row.original.day_of_week] ?? row.original.day_of_week,
    },
    {
      accessorKey: "time",
      header: "Time",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="tabular-nums">
          {hhmm(row.original.start_time)} - {hhmm(row.original.end_time)}
        </span>
      ),
    },
    {
      accessorKey: "kind",
      header: "Type",
      enableSorting: true,
      cell: ({ row }) => kindLabel(row.original.kind),
    },
    {
      accessorKey: "title",
      header: "Title",
      enableSorting: false,
      cell: ({ row }) => row.original.title ?? "-",
    },
    {
      accessorKey: "academic_class_name",
      header: "Class",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.academic_class_name ?? "-"}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.section_name ? `Section: ${row.original.section_name}` : "No section"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "subject_name",
      header: "Subject",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.subject_name ?? "-"}
          {row.original.subject_code ? (
            <span className="text-xs text-muted-foreground"> ({row.original.subject_code})</span>
          ) : null}
        </span>
      ),
    },
    {
      accessorKey: "teacher_name",
      header: "Teacher",
      enableSorting: true,
      cell: ({ row }) => <span className="font-medium">{row.original.teacher_name ?? "-"}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const sched = row.original;
        return (
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => args.onEdit(sched)}>
              Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={() => args.onDelete(sched)}>
              Delete
            </Button>
          </div>
        );
      },
    },
  ];
}

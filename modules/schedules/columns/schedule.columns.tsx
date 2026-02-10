"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { RowActionsDropdown } from "@/components/data-table/RowActionsDropdown";
import type { Schedule } from "../types/schedule.types";
import { ScheduleUpsertDialog } from "../components/ScheduleUpsertDialog";
import { ScheduleDeleteDialog } from "../components/ScheduleDeleteDialog";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function hhmm(v?: string) {
  if (!v) return "-";
  return v.slice(0, 5);
}

export function scheduleColumns(): ColumnDef<Schedule>[] {
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
      accessorKey: "academic_class_name",
      header: "Class",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.academic_class_name}</span>
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
        <div className="flex flex-col">
          <span className="font-medium">
            {row.original.subject_name} <span className="text-xs text-muted-foreground">({row.original.subject_code})</span>
          </span>
        </div>
      ),
    },
    {
      accessorKey: "teacher_name",
      header: "Teacher",
      enableSorting: true,
      cell: ({ row }) => <span className="font-medium">{row.original.teacher_name}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const sched = row.original;
        return (
          <RowActionsDropdown<Schedule>
            row={sched}
            items={[
              {
                key: "edit",
                label: "Edit",
                onSelect: () => {},
              },
              {
                key: "delete",
                label: "Delete",
                variant: "destructive",
                onSelect: () => {},
                separatorBefore: true,
              },
            ]}
          />
        );
      },
    },
  ];
}

/**
 * If you want the dropdown items to actually open dialogs,
 * easiest approach: render buttons directly instead of RowActionsDropdown.
 *
 * OR keep dropdown but route state via a small local state controller.
 * Below is the simple + clean version (recommended):
 */

export function ScheduleRowActionsInline({ schedule }: { schedule: Schedule }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <ScheduleUpsertDialog
        initial={schedule}
        trigger={<button className="text-sm text-primary underline">Edit</button>}
      />
      <ScheduleDeleteDialog
        id={schedule.id}
        label={<button className="text-sm text-destructive underline">Delete</button>}
      />
    </div>
  );
}

"use client";

import * as React from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { useDeleteSchedule } from "../hooks/schedule.hooks";

export function ScheduleDeleteDialog({
  id,
  label,
}: {
  id: string;
  label?: React.ReactNode;
}) {
  const del = useDeleteSchedule();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {label ? (
          <span>{label}</span>
        ) : (
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        )}
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete schedule?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove the schedule entry.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={del.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              del.mutate(id);
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={del.isPending}
          >
            {del.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>

        {del.isError ? (
          <div className="mt-2 text-sm text-destructive">Failed to delete.</div>
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}

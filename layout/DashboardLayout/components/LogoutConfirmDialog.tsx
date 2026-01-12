"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type LogoutConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title?: string;
  description?: string;

  confirmLabel?: string;
  cancelLabel?: string;

  loading?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function LogoutConfirmDialog({
  open,
  onOpenChange,
  title = "Log out?",
  description = "You’ll be signed out of your account on this device.",
  confirmLabel = "Logout",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
}: LogoutConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[calc(100vw-1.5rem)] max-w-[420px] rounded-2xl p-4 sm:p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base sm:text-lg">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel disabled={loading} className="w-full sm:w-auto">
            {cancelLabel}
          </AlertDialogCancel>

          <AlertDialogAction
            className="w-full sm:w-auto"
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
          >
            {loading ? "Logging out..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

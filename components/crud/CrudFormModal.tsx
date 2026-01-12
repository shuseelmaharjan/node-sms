"use client";

import React, { useMemo, useState } from "react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { FormWizard } from "@/components/form/FormWizard";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import type { CrudApi, CrudCache } from "@/components/crud/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { DialogClose } from "@/components/ui/dialog";

type CrudFormModalProps<S extends z.ZodObject<any, any>, Entity> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  titleCreate?: string;
  titleEdit?: string;

  schema: S;
  renderSections: (methods: any) => React.ReactNode;

  id?: string;
  createDefaults: z.infer<S>;

  api: CrudApi<S, Entity>;
  cache?: CrudCache;

  onSuccess?: (entity: Entity, mode: "create" | "edit") => void;
  onDeleted?: () => void;

  closeAfterSave?: boolean;
  canDelete?: boolean;
  externallyBlocked?: boolean;

  submitLabelCreate?: string;
  submitLabelUpdate?: string;

  disableSubmitUntilDirty?: boolean;

  /**
   * Optional: if you want a different width per usage.
   * Defaults are good for forms like School.
   */
  contentClassName?: string;
};

export function CrudFormModal<S extends z.ZodObject<any, any>, Entity>({
  open,
  onOpenChange,
  titleCreate = "Create",
  titleEdit = "Edit",
  schema,
  renderSections,
  id,
  createDefaults,
  api,
  cache,
  onSuccess,
  onDeleted,
  closeAfterSave = true,
  canDelete = true,
  externallyBlocked = false,
  submitLabelCreate = "Create",
  submitLabelUpdate = "Update",
  disableSubmitUntilDirty = true,
  contentClassName,
}: CrudFormModalProps<S, Entity>) {
  const queryClient = useQueryClient();
  const mode: "create" | "edit" = id ? "edit" : "create";

  const detailKey =
    cache?.detailKeyPrefix && id ? [...cache.detailKeyPrefix, id] : null;

  const entityQuery = useQuery({
    queryKey: detailKey ?? ["crud", "entity", id],
    queryFn: () => api.getById(id!),
    enabled: open && mode === "edit",
  });

  const defaults = useMemo(() => {
    if (mode === "create") return createDefaults;
    if (!entityQuery.data) return createDefaults;
    return api.toDefaults(entityQuery.data);
  }, [mode, entityQuery.data, api, createDefaults]);

  const resetKey = useMemo(() => {
    if (mode === "create") return `create-${open}`;
    if (!id) return `edit-missing-${open}`;
    return entityQuery.data
      ? `edit-${id}-${open}-ready`
      : `edit-${id}-${open}-loading`;
  }, [mode, id, open, entityQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (values: z.infer<S>) =>
      mode === "create" ? api.create(values) : api.update(id!, values),
    onSuccess: async (entity) => {
      if (cache?.listKey) {
        await queryClient.invalidateQueries({ queryKey: cache.listKey });
      }
      if (mode === "edit" && detailKey) {
        queryClient.setQueryData(detailKey, entity);
      }
      onSuccess?.(entity, mode);
      if (closeAfterSave) onOpenChange(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      await api.remove(id);
    },
    onSuccess: async () => {
      if (cache?.listKey) {
        await queryClient.invalidateQueries({ queryKey: cache.listKey });
      }
      if (detailKey) {
        await queryClient.invalidateQueries({ queryKey: detailKey });
      }
      onDeleted?.();
      onOpenChange(false);
    },
  });

  const [confirmOpen, setConfirmOpen] = useState(false);

  const blocked =
    externallyBlocked ||
    saveMutation.isPending ||
    deleteMutation.isPending ||
    (mode === "edit" && entityQuery.isFetching);

  const title = mode === "create" ? titleCreate : titleEdit;

  const showLoading = mode === "edit" && entityQuery.isLoading;
  const showError = mode === "edit" && entityQuery.isError;

  return (
    <>
      {/* 
        MOBILE CLOSE LOCK:
        - prevent closing via backdrop click / ESC (on mobile only)
        - allow close via X (DialogContent built-in close) or Cancel button (your FormWizard onCancel)
      */}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          // If attempting to close, only allow close on md+ screens.
          // On mobile, user must use X or Cancel button (which calls onOpenChange(false) explicitly).
          if (!v) {
            // `window` exists because this is a client component
            const isMobile = window.matchMedia("(max-width: 767px)").matches;
            if (isMobile) return; // block close
          }
          onOpenChange(v);
        }}
      >
        <DialogContent
          // Wider on desktop + nice scrollbars on desktop + hidden on mobile
          className={cn(
            // mobile first sizing
            "w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)]",
            // desktop width upgrade (your screenshot needs more)
            "md:w-1/3 md:max-w-4/5",
            // padding
            "p-4 sm:p-6",
            // height + scrolling
            "max-h-[85svh] overflow-y-auto",
            // scrollbar behavior:
            // - hide on mobile
            // - pretty thin on desktop
            "scrollbar-hide md:scrollbar-thin",

            contentClassName
          )}
          // extra safety: prevent outside-click close
          onPointerDownOutside={(e) => {
            // block on mobile only
            if (window.matchMedia("(max-width: 767px)").matches) {
              e.preventDefault();
            }
          }}
          // prevent ESC close on mobile only
          onEscapeKeyDown={(e) => {
            if (window.matchMedia("(max-width: 767px)").matches) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader className="space-y-0">
            <div className="flex items-start justify-between gap-3">
              <DialogTitle className="text-base font-semibold sm:text-lg">
                {title}
              </DialogTitle>

              <div className="flex items-center gap-2">
                {mode === "edit" && canDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmOpen(true)}
                    disabled={blocked}
                    className="hidden sm:inline-flex"
                  >
                    Delete
                  </Button>
                )}

                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => onOpenChange(false)} 
                  className={cn(
                    "rounded-md p-1.5",
                    "text-muted-foreground hover:text-foreground",
                    "hover:bg-accent/60 transition-colors",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 border-b" />
          </DialogHeader>


          <div>
            {showLoading ? (
              <div className="py-10 text-sm text-muted-foreground">Loading…</div>
            ) : showError ? (
              <div className="py-10 text-sm text-destructive">Failed to load.</div>
            ) : (
              <FormWizard
                schema={schema}
                defaultValues={defaults as any}
                resetKey={resetKey}
                blocked={blocked}
                externallyBlocked={externallyBlocked}
                submitLoading={saveMutation.isPending}
                submitLabel={mode === "create" ? submitLabelCreate : submitLabelUpdate}
                onCancel={() => onOpenChange(false)} // allowed close path on mobile
                disableSubmitUntilDirty={disableSubmitUntilDirty}
                className="space-y-2 sm:space-y-4"
                render={(methods) => renderSections(methods)}
                onSubmit={async (values) => {
                  await saveMutation.mutateAsync(values);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        loading={deleteMutation.isPending}
        title="Delete this item?"
        description="This action can’t be undone."
        onConfirm={async () => {
          await deleteMutation.mutateAsync();
          setConfirmOpen(false);
        }}
      />
    </>
  );
}

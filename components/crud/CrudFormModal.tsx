"use client";

import React, { useMemo, useState } from "react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FormWizard, StepDef } from "@/components/form/FormWizard";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import type { CrudApi, CrudCache } from "@/components/crud/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type CrudFormModalProps<S extends z.ZodObject<any, any>, Entity> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  titleCreate?: string;
  titleEdit?: string;

  schema: S;

  /** Use ONE of these:
   *  - steps => stepper (Back/Next)
   *  - renderSections => single form (Cancel/Submit)
   */
  steps?: StepDef<S>[];
  renderSections?: (methods: any) => React.ReactNode;

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
};

export function CrudFormModal<S extends z.ZodObject<any, any>, Entity>({
  open,
  onOpenChange,
  titleCreate = "Create",
  titleEdit = "Edit",
  schema,
  steps,
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

  const resetKey =
    mode === "edit"
      ? entityQuery.data
        ? `edit-${id}-${open}`
        : `edit-loading-${id}-${open}`
      : `create-${open}`;

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>{title}</DialogTitle>

            {mode === "edit" && canDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
                disabled={blocked}
              >
                Delete
              </Button>
            )}
          </DialogHeader>

          {mode === "edit" && entityQuery.isLoading ? (
            <div className="py-10">Loading...</div>
          ) : mode === "edit" && entityQuery.isError ? (
            <div className="py-10">Failed to load.</div>
          ) : (
            <FormWizard
              title={undefined}
              schema={schema}
              defaultValues={defaults as any}
              steps={steps}
              renderSections={renderSections}
              submitLabel={mode === "create" ? submitLabelCreate : submitLabelUpdate}
              submitLoading={saveMutation.isPending}
              submitDisabled={blocked}
              externallyBlocked={externallyBlocked}
              resetKey={resetKey}
              // ✅ Cancel + Submit (no Back/Next when steps is undefined)
              isEditing={true}
              onCancelEditing={() => onOpenChange(false)}
              dirtyBarPlacement="none"
              stickyFooter={true}
              onSubmit={async (values) => {
                await saveMutation.mutateAsync(values);
              }}
            />
          )}
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

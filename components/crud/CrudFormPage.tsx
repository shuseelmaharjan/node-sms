"use client";

import React, { useMemo, useState } from "react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FormWizard } from "@/components/form/FormWizard";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import type { CrudApi, CrudCache } from "@/components/crud/types";
import { Spinner } from "@/components/ui/spinner";

type CrudFormPageProps<S extends z.ZodObject<any, any>, Entity> = {
  title?: string;

  schema: S;

  /**
   * Render form fields for the page.
   */
  renderSections: (methods: any) => React.ReactNode;

  id?: string;
  createDefaults: z.infer<S>;

  api: CrudApi<S, Entity>;
  cache?: CrudCache;

  onSuccess?: (entity: Entity, mode: "create" | "edit") => void;
  onDeleted?: () => void;

  submitLabelCreate?: string;
  submitLabelUpdate?: string;

  canDelete?: boolean;
  externallyBlocked?: boolean;
  className?: string;

  disableSubmitUntilDirty?: boolean;
};

export function CrudFormPage<S extends z.ZodObject<any, any>, Entity>({
  title,
  schema,
  renderSections,
  id,
  createDefaults,
  api,
  cache,
  onSuccess,
  onDeleted,
  submitLabelCreate = "Create",
  submitLabelUpdate = "Update",
  canDelete = true,
  externallyBlocked = false,
  className,
  disableSubmitUntilDirty = true,
}: CrudFormPageProps<S, Entity>) {
  const queryClient = useQueryClient();
  const mode: "create" | "edit" = id ? "edit" : "create";

  const detailKey =
    cache?.detailKeyPrefix && id ? [...cache.detailKeyPrefix, id] : null;

  const entityQuery = useQuery({
    queryKey: detailKey ?? ["crud", "entity", id],
    queryFn: () => api.getById(id!),
    enabled: mode === "edit",
  });

  const defaults = useMemo(() => {
    if (mode === "create") return createDefaults;
    if (!entityQuery.data) return createDefaults;
    return api.toDefaults(entityQuery.data);
  }, [mode, entityQuery.data, api, createDefaults]);

  const resetKey = useMemo(() => {
    if (mode === "create") return "create";
    if (!id) return "edit-missing";
    return entityQuery.data ? `edit-${id}-ready` : `edit-${id}-loading`;
  }, [mode, id, entityQuery.data]);

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
    },
  });

  const [confirmOpen, setConfirmOpen] = useState(false);

  const blocked =
    externallyBlocked ||
    saveMutation.isPending ||
    deleteMutation.isPending ||
    (mode === "edit" && entityQuery.isFetching);

  if (mode === "edit" && entityQuery.isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Spinner />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (mode === "edit" && entityQuery.isError) {
    return <div className="p-6 text-sm text-destructive">Failed to load.</div>;
  }

  return (
    <div className="space-y-4">
      {(title || (mode === "edit" && canDelete)) && (
        <div className="flex items-center justify-between gap-3">
          {title ? <h1 className="text-lg font-semibold">{title}</h1> : <div />}

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
        </div>
      )}

      <div className={className}>
        <FormWizard
          schema={schema}
          defaultValues={defaults as any}
          resetKey={resetKey}
          blocked={blocked}
          externallyBlocked={externallyBlocked}
          submitLoading={saveMutation.isPending}
          submitLabel={mode === "create" ? submitLabelCreate : submitLabelUpdate}
          disableSubmitUntilDirty={disableSubmitUntilDirty}
          // On a page, cancel usually navigates away; if you want, pass a handler
          render={(methods) => renderSections(methods)}
          onSubmit={async (values, methods) => {
            await saveMutation.mutateAsync(values);

            if (mode === "create") {
              // clear after create
              methods.reset(createDefaults as any, { keepDefaultValues: true });
              methods.clearErrors();
              return;
            }

            // mode === "edit"
            // keep values but make form clean after update
            const currentValues = methods.getValues();
            methods.reset(currentValues, { keepDefaultValues: false });
            methods.clearErrors();
          }}


        />
      </div>

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
    </div>
  );
}

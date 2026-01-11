"use client";

import React, { useMemo, useState } from "react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FormWizard, StepDef } from "@/components/form/FormWizard";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import type { CrudApi, CrudCache } from "@/components/crud/types";

type CrudFormPageProps<S extends z.ZodObject<any, any>, Entity> = {
  title?: string;

  schema: S;
  steps: StepDef<S>[];

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
};

export function CrudFormPage<S extends z.ZodObject<any, any>, Entity>({
  title,
  schema,
  steps,
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

  const resetKey =
    mode === "edit"
      ? entityQuery.data
        ? `edit-${id}`
        : `edit-loading-${id}`
      : "create";

  const saveMutation = useMutation({
    mutationFn: async (values: z.infer<S>) => {
      return mode === "create" ? api.create(values) : api.update(id!, values);
    },
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
    return <div className="p-6">Loading...</div>;
  }
  if (mode === "edit" && entityQuery.isError) {
    return <div className="p-6">Failed to load.</div>;
  }

  return (
    <div className="space-y-4">
      {mode === "edit" && canDelete && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={blocked}
          >
            Delete
          </Button>
        </div>
      )}

      <FormWizard
        title={title}
        schema={schema}
        defaultValues={defaults as any}
        steps={steps}
        submitLabel={mode === "create" ? submitLabelCreate : submitLabelUpdate}
        submitLoading={saveMutation.isPending}
        submitDisabled={blocked}
        externallyBlocked={externallyBlocked}
        resetKey={resetKey}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values);
        }}
        className={className}
      />

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

"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/api";
import { handleFormError } from "@/lib/handleFormError";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/fields/InputField";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { teacherLevelSchema, type TeacherLevelValues } from "../schema/teacher-level.schema";
import type { TeacherLevelEntity } from "../columns/teacher-level.columns";

const LIST_URL = "/api/v1/teacher-levels/";
const DETAIL_URL = (id: string) => `/api/v1/teacher-levels/${id}/`;

const createDefaults: TeacherLevelValues = { level: "" };

function toDefaults(entity: TeacherLevelEntity): TeacherLevelValues {
  return { level: entity.level ?? "" };
}

function toPayload(values: TeacherLevelValues) {
  return {
    level: values.level,
    status: "active", // create is always active (programmatically)
  };
}

export function TeacherLevelFormModal(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editId: string | null; // null => create
}) {
  const qc = useQueryClient();
  const isEdit = props.editId != null;

  const detailQuery = useQuery({
    queryKey: ["teacher-levels", "detail", props.editId ?? null],
    enabled: props.open && isEdit && Boolean(props.editId),
    queryFn: async () => {
      const res = await api.get<TeacherLevelEntity>(DETAIL_URL(props.editId!));
      return (res.data as any)?.data ?? res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: TeacherLevelValues) => {
      const res = await api.post(LIST_URL, toPayload(values));
      return (res.data as any)?.data ?? res.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["teacher-levels", "list"] });
      props.onOpenChange(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: TeacherLevelValues) => {
      const res = await api.put(DETAIL_URL(props.editId!), { level: values.level });
      return (res.data as any)?.data ?? res.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["teacher-levels", "list"] });
      await qc.invalidateQueries({ queryKey: ["teacher-levels", "detail", props.editId] });
      props.onOpenChange(false);
    },
  });

  const blocked = detailQuery.isFetching || createMutation.isPending || updateMutation.isPending;
  const entity = detailQuery.data ?? null;

  const defaultValues = React.useMemo<TeacherLevelValues>(() => {
    if (isEdit && entity) return toDefaults(entity);
    return createDefaults;
  }, [isEdit, entity]);

  const resetKey = React.useMemo(() => {
    if (!props.open) return "closed";
    if (!isEdit) return "create-open";
    return entity ? `edit-${props.editId}-ready` : `edit-${props.editId}-loading`;
  }, [props.open, isEdit, entity, props.editId]);

  const title = isEdit ? "Update Teacher Level" : "Add Teacher Level";

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[640px] overflow-visible">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <FormWizard
          schema={teacherLevelSchema}
          defaultValues={defaultValues}
          resetKey={resetKey}
          blocked={blocked}
          submitLoading={createMutation.isPending || updateMutation.isPending}
          submitLabel={isEdit ? "Update" : "Create"}
          disableSubmitUntilDirty={isEdit}
          onSubmit={async (values, methods) => {
            try {
              if (isEdit) await updateMutation.mutateAsync(values);
              else await createMutation.mutateAsync(values);
            } catch (error) {
              handleFormError(error, { setError: methods.setError });
            }
          }}
          render={(methods) => (
            <div className="space-y-4">
              <InputField
                label="Level"
                required
                placeholder="e.g. Primary / Secondary"
                disabled={blocked}
                {...methods.register("level")}
                error={methods.formState.errors.level as any}
              />
              <p className="text-xs text-muted-foreground">
                Status is managed from the list (switch). New levels are created as <span className="font-medium">Active</span>.
              </p>
            </div>
          )}
        />
      </DialogContent>
    </Dialog>
  );
}

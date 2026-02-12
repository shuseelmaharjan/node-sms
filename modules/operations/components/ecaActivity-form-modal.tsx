"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { handleFormError } from "@/lib/handleFormError";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/fields/InputField";
import { SelectField } from "@/components/fields/SelectField";

import { ecaActivitySchema, type EcaActivityValues } from "../schema/ecaActivity.schema";
import type { EcaActivityEntity } from "../columns/ecaActivity.columns";

const LIST_URL = "/api/v1/eca/activities/";
const DETAIL_URL = (id: string) => `/api/v1/eca/activities/${id}/`;
const FEE_STRUCTURES_URL = "/api/v1/fees/fee-structures/?status=active"; // options

type SimpleOption = { value: string; label: string };

const createDefaults: EcaActivityValues = {
  name: "",
  description: "",
  fees: "",
};

function toDefaults(entity: EcaActivityEntity): EcaActivityValues {
  return {
    name: entity.name ?? "",
    description: entity.description ?? "",
    fees: entity.fees ?? "",
  };
}

function toPayload(values: EcaActivityValues) {
  return {
    name: values.name,
    description: values.description,
    fees: values.fees,
  };
}

export function EcaActivityFormModal(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editId: string | null;
}) {
  const qc = useQueryClient();
  const isEdit = props.editId != null;

  const detailQuery = useQuery({
    queryKey: ["eca-activities", "detail", props.editId ?? null],
    enabled: props.open && isEdit && Boolean(props.editId),
    queryFn: async () => {
      const res = await api.get<EcaActivityEntity>(DETAIL_URL(props.editId!));
      return res.data;
    },
  });

  const feeStructuresQuery = useQuery({
    queryKey: ["fee-structures", "active-options"],
    enabled: props.open,
    queryFn: async () => {
      const res = await api.get<any>(FEE_STRUCTURES_URL, { params: { page_size: 200 } });
      const items = res.data?.results ?? res.data ?? [];
      return items as Array<{ id: string; amount: string; currency: string; period: string; scope: string }>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: EcaActivityValues) => {
      const res = await api.post(LIST_URL, toPayload(values));
      return res.data as any;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["eca-activities", "list"] });
      props.onOpenChange(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: EcaActivityValues) => {
      const res = await api.put(DETAIL_URL(props.editId!), toPayload(values));
      return res.data as any;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["eca-activities", "list"] });
      await qc.invalidateQueries({ queryKey: ["eca-activities", "detail", props.editId] });
      props.onOpenChange(false);
    },
  });

  const blocked =
    detailQuery.isFetching ||
    feeStructuresQuery.isFetching ||
    createMutation.isPending ||
    updateMutation.isPending;

  const entity = detailQuery.data ?? null;

  const defaultValues = React.useMemo<EcaActivityValues>(() => {
    if (isEdit && entity) return toDefaults(entity);
    return createDefaults;
  }, [isEdit, entity]);

  const resetKey = React.useMemo(() => {
    if (!props.open) return "closed";
    if (!isEdit) return "create-open";
    return entity ? `edit-${props.editId}-ready` : `edit-${props.editId}-loading`;
  }, [props.open, isEdit, entity, props.editId]);

  const title = isEdit ? "Update ECA Activity" : "Add ECA Activity";

  const feeOptions: SimpleOption[] =
    (feeStructuresQuery.data ?? []).map((f) => ({
      value: f.id,
      label: `${f.amount} ${f.currency} • ${f.period} • ${f.scope}`,
    })) ?? [];

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[820px] overflow-visible">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <FormWizard
          schema={ecaActivitySchema}
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
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InputField
                  label="Name"
                  required
                  placeholder="e.g. Basketball"
                  disabled={blocked}
                  {...methods.register("name")}
                  error={methods.formState.errors.name as any}
                />

                <SelectField<any>
                  control={methods.control}
                  name={"fees"}
                  label="Fee Structure"
                  required
                  placeholder={feeStructuresQuery.isLoading ? "Loading..." : "Select fee structure"}
                  options={feeOptions as any}
                  disabled={blocked || feeStructuresQuery.isLoading}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <InputField
                  label="Description"
                  required
                  placeholder="Enter activity description"
                  disabled={blocked}
                  {...methods.register("description")}
                  error={methods.formState.errors.description as any}
                />
              </div>
            </div>
          )}
        />
      </DialogContent>
    </Dialog>
  );
}

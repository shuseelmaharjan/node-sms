"use client";

import * as React from "react";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/form/InputField";
import { personalInfoSchema, type PersonalInfoValues } from "../../schema/admin.schema";

export function PersonalStep(props: {
  mode: "create" | "edit" | "view";
  initial?: Partial<PersonalInfoValues> | null;
  onSubmit: (values: PersonalInfoValues) => Promise<void>;
  submitLoading: boolean;
  resetKey: string;
}) {
  const defaults: PersonalInfoValues = {
    phone: props.initial?.phone ?? "",
    email: props.initial?.email ?? "",
    first_name: props.initial?.first_name ?? "",
    middle_name: props.initial?.middle_name ?? "",
    last_name: props.initial?.last_name ?? "",
  };

  return (
    <FormWizard
      schema={personalInfoSchema}
      defaultValues={defaults}
      resetKey={props.resetKey}
      blocked={props.mode === "view"}
      submitLoading={props.submitLoading}
      submitLabel={props.mode === "create" ? "Save & Continue" : "Update & Continue"}
      disableSubmitUntilDirty={props.mode !== "create"}
      onSubmit={async (values) => props.onSubmit(values)}
      render={(methods) => (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField
              label="First Name"
              required
              disabled={props.mode === "view"}
              {...methods.register("first_name")}
              error={methods.formState.errors.first_name}
            />
            <InputField
              label="Middle Name"
              disabled={props.mode === "view"}
              {...methods.register("middle_name")}
              error={methods.formState.errors.middle_name}
            />
            <InputField
              label="Last Name"
              required
              disabled={props.mode === "view"}
              {...methods.register("last_name")}
              error={methods.formState.errors.last_name}
            />
            <InputField
              label="Phone"
              required
              disabled={props.mode === "view"}
              {...methods.register("phone")}
              error={methods.formState.errors.phone}
            />
            <div className="md:col-span-2">
              <InputField
                label="Email"
                type="email"
                required
                disabled={props.mode === "view"}
                {...methods.register("email")}
                error={methods.formState.errors.email}
              />
            </div>
          </div>
        </div>
      )}
    />
  );
}

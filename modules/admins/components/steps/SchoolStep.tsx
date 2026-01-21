"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/form/InputField";
import { ImagePickerField } from "@/components/form/ImagePickerField";
import { SwitchField } from "@/components/form/SwitchField";
import { schoolInfoSchema, type SchoolInfoValues } from "../../schema/admin.schema";

export function SchoolStep(props: {
  mode: "create" | "edit" | "view";
  initial?: {
    code?: string;
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    is_active?: boolean;

    logo_file_id?: string | null;
    logo_file_url?: string | null;

    pan_number?: string;
    registration_number?: string;

    pan_doc_id?: string | null;
    pan_doc_url?: string | null;

    reg_doc_id?: string | null;
    reg_doc_url?: string | null;
  } | null;

  onSubmit: (values: SchoolInfoValues) => Promise<void>;
  submitLoading: boolean;
  resetKey: string;
  externallyBlocked?: boolean;
}) {
  const defaults: SchoolInfoValues = {
    code: props.initial?.code ?? "",
    name: props.initial?.name ?? "",
    address: props.initial?.address ?? "",
    phone: props.initial?.phone ?? "",
    email: props.initial?.email ?? "",

    logo_file: props.initial?.logo_file_id ?? null,
    pan_number: props.initial?.pan_number ?? "",
    registration_number: props.initial?.registration_number ?? "",
    pan_document_file: props.initial?.pan_doc_id ?? null,
    registration_document_file: props.initial?.reg_doc_id ?? null,

    is_active: Boolean(props.initial?.is_active ?? true),
  };

  const readOnly = props.mode === "view";

  return (
    <FormWizard
      schema={schoolInfoSchema}
      defaultValues={defaults}
      resetKey={props.resetKey}
      blocked={readOnly}
      externallyBlocked={props.externallyBlocked ?? false}
      submitLoading={props.submitLoading}
      submitLabel={props.mode === "create" ? "Save & Continue" : "Update & Continue"}
      disableSubmitUntilDirty={props.mode !== "create"}
      onSubmit={async (values) => props.onSubmit(values)}
      render={(methods) => (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-6">
            <Controller
              control={methods.control}
              name="logo_file"
              render={({ field, fieldState }) => (
                <ImagePickerField
                  title="School Logo"
                  hint="Upload school logo"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  initialUri={props.initial?.logo_file_url ?? null}
                  error={fieldState.error}
                  required={false}
                  fileType="image"
                  deleteOnRemove={false}
                  onUploadStatusChange={() => {}}
                />
              )}
            />

            <Controller
              control={methods.control}
              name="pan_document_file"
              render={({ field, fieldState }) => (
                <ImagePickerField
                  title="PAN Document"
                  hint="Upload PAN document"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  initialUri={props.initial?.pan_doc_url ?? null}
                  error={fieldState.error}
                  required={false}
                  fileType="image"
                  deleteOnRemove={false}
                  onUploadStatusChange={() => {}}
                />
              )}
            />

            <Controller
              control={methods.control}
              name="registration_document_file"
              render={({ field, fieldState }) => (
                <ImagePickerField
                  title="Registration Document"
                  hint="Upload registration document"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  initialUri={props.initial?.reg_doc_url ?? null}
                  error={fieldState.error}
                  required={false}
                  fileType="image"
                  deleteOnRemove={false}
                  onUploadStatusChange={() => {}}
                />
              )}
            />
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                label="Code"
                required
                disabled={readOnly}
                {...methods.register("code")}
                error={methods.formState.errors.code}
              />
              <InputField
                label="School Name"
                required
                disabled={readOnly}
                {...methods.register("name")}
                error={methods.formState.errors.name}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                label="Email"
                type="email"
                required
                disabled={readOnly}
                {...methods.register("email")}
                error={methods.formState.errors.email}
              />
              <InputField
                label="Phone"
                required
                disabled={readOnly}
                {...methods.register("phone")}
                error={methods.formState.errors.phone}
              />
            </div>

            <InputField
              label="Address"
              required
              disabled={readOnly}
              {...methods.register("address")}
              error={methods.formState.errors.address}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                label="PAN Number"
                required
                disabled={readOnly}
                {...methods.register("pan_number")}
                error={methods.formState.errors.pan_number}
              />
              <InputField
                label="Registration Number"
                required
                disabled={readOnly}
                {...methods.register("registration_number")}
                error={methods.formState.errors.registration_number}
              />
            </div>

            <Controller
              control={methods.control}
              name="is_active"
              render={({ field }) => (
                <SwitchField
                  label="Active"
                  description="Disable to mark school inactive"
                  checked={Boolean(field.value)}
                  onCheckedChange={field.onChange}
                  disabled={readOnly}
                />
              )}
            />
          </div>
        </div>
      )}
    />
  );
}

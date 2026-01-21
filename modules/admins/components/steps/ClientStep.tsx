"use client";

import * as React from "react";
import { Controller, useFieldArray } from "react-hook-form";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/form/InputField";
import { Button } from "@/components/ui/button";
import { clientInfoSchema, type ClientInfoValues } from "../../schema/admin.schema";
import { NepaliBsDatePickerField } from "@/lib/nepaliDate/NepaliBsDatePickerField";

export function ClientStep(props: {
  mode: "create" | "edit" | "view";
  initial?: any | null; // admin detail.profile etc.
  onSubmit: (values: ClientInfoValues) => Promise<void>;
  submitLoading: boolean;
  resetKey: string;
}) {
  const readOnly = props.mode === "view";
  const p = props.initial?.profile ?? null;

  const defaults: ClientInfoValues = {
    date_of_birth: p?.date_of_birth_display ?? "",
    date_of_birth_type: "bs",
    gender: p?.gender ?? "Male",
    blood_group: p?.blood_group ?? "O+",
    nationality: p?.nationality ?? "Nepali",
    religion: p?.religion ?? "Hindu",
    mother_tongue: p?.mother_tongue ?? "Nepali",
    citizenship_no: p?.citizenship_no ?? "",
    pan_no: p?.pan_no ?? "",

    addresses: p?.addresses?.length
      ? p.addresses.map((a: any) => ({
          address_type: a.address_type,
          country: a.country ?? "Nepal",
          province: a.province ?? "",
          district: a.district ?? "",
          municipality: a.municipality ?? "",
          ward_no: String(a.ward_no ?? ""),
          street: a.street ?? "",
          tole: a.tole ?? "",
          house_no: a.house_no ?? "",
          postal_code: a.postal_code ?? "",
          is_primary: Boolean(a.is_primary),
        }))
      : [
          {
            address_type: "permanent",
            country: "Nepal",
            province: "Bagmati",
            district: "",
            municipality: "",
            ward_no: "",
            street: "",
            tole: "",
            house_no: "",
            postal_code: "",
            is_primary: true,
          },
        ],

    documents: p?.documents?.length
      ? p.documents.map((d: any) => ({
          document_type: d.document_type,
          file: d.file?.id ?? null,
          issued_by: d.issued_by ?? "",
          issued_date: d.issued_date ?? null,
          expiry_date: d.expiry_date ?? null,
          remarks: d.remarks ?? "",
        }))
      : [
          { document_type: "photo", file: null, issued_by: "", issued_date: null, expiry_date: null, remarks: "Photo" },
        ],
  };

  return (
    <FormWizard
      schema={clientInfoSchema}
      defaultValues={defaults}
      resetKey={props.resetKey}
      blocked={readOnly}
      submitLoading={props.submitLoading}
      submitLabel={props.mode === "create" ? "Submit Admin" : "Update Admin"}
      disableSubmitUntilDirty={props.mode !== "create"}
      onSubmit={async (values) => props.onSubmit(values)}
      render={(methods) => {
        const addresses = useFieldArray({ control: methods.control, name: "addresses" });
        const documents = useFieldArray({ control: methods.control, name: "documents" });

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <NepaliBsDatePickerField<ClientInfoValues>
                control={methods.control as any}
                name="date_of_birth"
                label="Date of Birth (BS)"
                disabled={readOnly}
              />

              <InputField
                label="Gender"
                required
                disabled={readOnly}
                {...methods.register("gender")}
                error={methods.formState.errors.gender}
              />
              <InputField
                label="Blood Group"
                required
                disabled={readOnly}
                {...methods.register("blood_group")}
                error={methods.formState.errors.blood_group}
              />
              <InputField
                label="Nationality"
                required
                disabled={readOnly}
                {...methods.register("nationality")}
                error={methods.formState.errors.nationality}
              />
              <InputField
                label="Religion"
                required
                disabled={readOnly}
                {...methods.register("religion")}
                error={methods.formState.errors.religion}
              />
              <InputField
                label="Mother Tongue"
                required
                disabled={readOnly}
                {...methods.register("mother_tongue")}
                error={methods.formState.errors.mother_tongue}
              />
              <InputField
                label="Citizenship No"
                required
                disabled={readOnly}
                {...methods.register("citizenship_no")}
                error={methods.formState.errors.citizenship_no}
              />
              <InputField
                label="PAN No"
                required
                disabled={readOnly}
                {...methods.register("pan_no")}
                error={methods.formState.errors.pan_no}
              />

              <input type="hidden" value="bs" {...methods.register("date_of_birth_type")} />
            </div>

            {/* Addresses */}
            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Addresses</h3>
                {!readOnly ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      addresses.append({
                        address_type: "temporary",
                        country: "Nepal",
                        province: "",
                        district: "",
                        municipality: "",
                        ward_no: "",
                        street: "",
                        tole: "",
                        house_no: "",
                        postal_code: "",
                        is_primary: false,
                      })
                    }
                  >
                    + Add
                  </Button>
                ) : null}
              </div>

              {addresses.fields.map((f, idx) => (
                <div key={f.id} className="grid grid-cols-1 gap-3 md:grid-cols-3 rounded border p-3">
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <select
                      className="mt-1 w-full rounded border px-3 py-2"
                      disabled={readOnly}
                      {...methods.register(`addresses.${idx}.address_type` as const)}
                    >
                      <option value="permanent">permanent</option>
                      <option value="temporary">temporary</option>
                    </select>
                    {methods.formState.errors.addresses?.[idx]?.address_type?.message ? (
                      <p className="text-xs text-destructive mt-1">
                        {methods.formState.errors.addresses?.[idx]?.address_type?.message as any}
                      </p>
                    ) : null}
                  </div>

                  <InputField
                    label="Province"
                    required
                    disabled={readOnly}
                    {...methods.register(`addresses.${idx}.province` as const)}
                    error={methods.formState.errors.addresses?.[idx]?.province as any}
                  />
                  <InputField
                    label="District"
                    required
                    disabled={readOnly}
                    {...methods.register(`addresses.${idx}.district` as const)}
                    error={methods.formState.errors.addresses?.[idx]?.district as any}
                  />
                  <InputField
                    label="Municipality"
                    required
                    disabled={readOnly}
                    {...methods.register(`addresses.${idx}.municipality` as const)}
                    error={methods.formState.errors.addresses?.[idx]?.municipality as any}
                  />
                  <InputField
                    label="Ward No"
                    required
                    disabled={readOnly}
                    {...methods.register(`addresses.${idx}.ward_no` as const)}
                    error={methods.formState.errors.addresses?.[idx]?.ward_no as any}
                  />

                  {!readOnly ? (
                    <div className="md:col-span-3 flex justify-end">
                      <Button type="button" variant="destructive" size="sm" onClick={() => addresses.remove(idx)}>
                        Remove
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Documents */}
            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Documents</h3>
                {!readOnly ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      documents.append({
                        document_type: "photo",
                        file: null,
                        issued_by: "",
                        issued_date: null,
                        expiry_date: null,
                        remarks: "",
                      })
                    }
                  >
                    + Add
                  </Button>
                ) : null}
              </div>

              {documents.fields.map((f, idx) => (
                <div key={f.id} className="grid grid-cols-1 gap-3 md:grid-cols-3 rounded border p-3">
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <select
                      className="mt-1 w-full rounded border px-3 py-2"
                      disabled={readOnly}
                      {...methods.register(`documents.${idx}.document_type` as const)}
                    >
                      <option value="photo">photo</option>
                      <option value="citizenship_front">citizenship_front</option>
                      <option value="citizenship_back">citizenship_back</option>
                      <option value="pan">pan</option>
                      <option value="signature">signature</option>
                    </select>
                  </div>

                  <InputField
                    label="File ID"
                    disabled={readOnly}
                    {...methods.register(`documents.${idx}.file` as const)}
                    error={methods.formState.errors.documents?.[idx]?.file as any}
                  />

                  <InputField
                    label="Issued Date (AD)"
                    disabled={readOnly}
                    placeholder="YYYY-MM-DD"
                    {...methods.register(`documents.${idx}.issued_date` as const)}
                    error={methods.formState.errors.documents?.[idx]?.issued_date as any}
                  />

                  {!readOnly ? (
                    <div className="md:col-span-3 flex justify-end">
                      <Button type="button" variant="destructive" size="sm" onClick={() => documents.remove(idx)}>
                        Remove
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        );
      }}
    />
  );
}

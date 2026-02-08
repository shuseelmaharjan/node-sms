"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/api";
import { FormWizard } from "@/components/form/FormWizard";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/fields/InputField";
import { ImagePickerField } from "@/components/form/ImagePickerField";
import { NepaliBsDatePickerField } from "@/components/nepaliDate/NepaliBsDatePickerField";
import {
  BloodGroupSelectField,
  GenderSelectField,
  MotherTongueSelectField,
  NationalitySelectField,
  ReligionSelectField,
} from "@/components/select";
import { NepalAddressFields } from "@/components/address/NepalAddressFields";
import { PageShell } from "@/components/layout/PageShell";
import { handleFormError } from "@/lib/handleFormError";
import { convertBsToAd, convertAdToBs } from "@/lib/date-utils";

import { SelectField } from "@/components/fields/SelectField"; // if you have one; else replace with your select component
import { staffSchema, type StaffValues } from "../schema/staff.schema";
import type { StaffEntity, FileEntity } from "../columns/staff.columns";

const LIST_URL = "/api/onboarding/staff-users/";
const DETAIL_URL = (id: string) => `/api/onboarding/staff-users/${id}/`;

function normalizePhoneForForm(phone?: string | null) {
  if (!phone) return "";
  return String(phone).replace(/^\+977/, "").trim();
}

function formatPhoneForApi(phone: string) {
  const raw = (phone ?? "").trim();
  if (!raw) return "";
  if (raw.startsWith("+")) return raw;
  return `+977${raw}`;
}

const roleOptions = [
  { label: "Cashier", value: "cashier" },
  { label: "Teacher", value: "teacher" },
  { label: "Accountant", value: "accountant" },
  { label: "Vice Principal", value: "vice_principal" },
  { label: "Coordinator", value: "coordinator" },
];

const createDefaults: StaffValues = {
  role: "teacher",
  user: { first_name: "", middle_name: "", last_name: "", phone: "", email: "" },
  profile: {
    date_of_birth_bs: "",
    gender: "",
    blood_group: "",
    nationality: "",
    religion: "",
    mother_tongue: "",
    citizenship_no: "",
    pan_no: "",
  },
  addresses: [
    {
      address_type: "permanent",
      province: "",
      district: "",
      municipality: "",
      ward_no: "",
      country: "Nepal",
      street: "",
      tole: "",
      house_no: "",
      postal_code: "",
      is_primary: true,
    },
    {
      address_type: "temporary",
      province: "",
      district: "",
      municipality: "",
      ward_no: "",
      country: "Nepal",
      street: "",
      tole: "",
      house_no: "",
      postal_code: "",
      is_primary: false,
    },
  ],
  documents: {
    photo_id: "",
    photo_file: "",

    citizenship_front_id: "",
    citizenship_front_file: "",

    citizenship_back_id: "",
    citizenship_back_file: "",

    pan_id: "",
    pan_file: "",

    signature_id: "",
    signature_file: "",

    other_id: "",
    other_file: "",
  },
};

function pickAddress(entity: StaffEntity, type: "permanent" | "temporary") {
  const a = entity.profile?.addresses?.find((x: any) => x.address_type === type);
  return {
    id: a?.id,
    address_type: type,
    province: a?.province ?? "",
    district: a?.district ?? "",
    municipality: a?.municipality ?? "",
    ward_no: a?.ward_no ?? "",
    country: a?.country ?? "Nepal",
    street: a?.street ?? "",
    tole: a?.tole ?? "",
    house_no: a?.house_no ?? "",
    postal_code: a?.postal_code ?? "",
    is_primary: Boolean(a?.is_primary ?? (type === "permanent")),
  };
}

function isTemporaryAddressFilled(a: any) {
  if (!a) return false;
  return Boolean(a.province || a.district || a.municipality || a.ward_no || a.tole);
}

// ---- documents normalization ----
// API sample shows profile.documents as array of {document_type, file: uuid}
// but your student module expects object keys -> { photo: {file: {id, file_url}} }
function normalizeProfileDocuments(profileDocs: any): Record<string, any> {
  if (!profileDocs) return {};
  if (Array.isArray(profileDocs)) {
    // array => object keyed by document_type
    const out: Record<string, any> = {};
    for (const d of profileDocs) {
      const k = String(d?.document_type ?? "").toLowerCase();
      if (!k) continue;
      out[k] = {
        id: d.id,
        document_type: d.document_type,
        file: d.file, // might be uuid only (not expanded)
        issued_by: d.issued_by,
        issued_date: d.issued_date,
        expiry_date: d.expiry_date,
        remarks: d.remarks,
        created_at: d.created_at,
      };
    }
    return out;
  }
  // already object
  return profileDocs as any;
}

function toDefaults(entity: StaffEntity): StaffValues {
  const docsObj = normalizeProfileDocuments(entity.profile?.documents);

  const dobAd = entity.profile?.date_of_birth_in_ad ?? "";
  const dobBs =
    entity.profile?.date_of_birth_in_bs ??
    (dobAd ? convertAdToBs(dobAd) ?? "" : "");

  // In edit, we need file ids. If backend returns expanded file object, use file.id else use raw uuid.
  const fileId = (v: any) => {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object" && v.id) return v.id;
    return "";
  };

  return {
    role: (entity.role as any) ?? "teacher",
    user: {
      first_name: entity.first_name ?? "",
      middle_name: entity.middle_name ?? "",
      last_name: entity.last_name ?? "",
      phone: normalizePhoneForForm(entity.phone),
      email: entity.email ?? "",
    },
    profile: {
      date_of_birth_bs: dobBs ?? "",
      gender: entity.profile?.gender ?? "",
      blood_group: entity.profile?.blood_group ?? "",
      nationality: entity.profile?.nationality ?? "",
      religion: entity.profile?.religion ?? "",
      mother_tongue: entity.profile?.mother_tongue ?? "",
      citizenship_no: entity.profile?.citizenship_no ?? "",
      pan_no: entity.profile?.pan_no ?? "",
    },
    addresses: [pickAddress(entity, "permanent"), pickAddress(entity, "temporary")],
    documents: {
      photo_id: docsObj?.photo?.id ?? "",
      photo_file: fileId(docsObj?.photo?.file),

      citizenship_front_id: docsObj?.citizenship_front?.id ?? "",
      citizenship_front_file: fileId(docsObj?.citizenship_front?.file),

      citizenship_back_id: docsObj?.citizenship_back?.id ?? "",
      citizenship_back_file: fileId(docsObj?.citizenship_back?.file),

      pan_id: docsObj?.pan?.id ?? "",
      pan_file: fileId(docsObj?.pan?.file),

      signature_id: docsObj?.signature?.id ?? "",
      signature_file: fileId(docsObj?.signature?.file),

      other_id: docsObj?.other?.id ?? "",
      other_file: fileId(docsObj?.other?.file),
    },
  };
}

function docObj(fileId: string, issuedDate?: string, id?: string) {
  if (!fileId) return null;
  return {
    ...(id ? { id } : {}),
    file: fileId,
    remarks: "",
    issued_by: "",
    issued_date: issuedDate || "",
    expiry_date: issuedDate || "",
  };
}

function toPayload(values: StaffValues) {
  const dobAd = convertBsToAd(values.profile.date_of_birth_bs) || "";

  const addresses = values.addresses
    .filter((a) => (a.address_type === "permanent" ? true : isTemporaryAddressFilled(a)))
    .map((a) => ({
      ...(a.id ? { id: a.id } : {}),
      address_type: a.address_type,
      province: a.province,
      district: a.district,
      municipality: a.municipality,
      ward_no: a.ward_no,
      country: a.country || "Nepal",
      street: a.street,
      tole: a.tole,
      house_no: a.house_no,
      postal_code: a.postal_code,
      is_primary: a.is_primary,
    }));

  const docs: any = {
    photo: docObj(values.documents.photo_file, dobAd, values.documents.photo_id || undefined),
    citizenship_front: docObj(
      values.documents.citizenship_front_file,
      dobAd,
      values.documents.citizenship_front_id || undefined
    ),
    citizenship_back: docObj(
      values.documents.citizenship_back_file,
      dobAd,
      values.documents.citizenship_back_id || undefined
    ),
    pan: docObj(values.documents.pan_file, dobAd, values.documents.pan_id || undefined),
    signature: docObj(values.documents.signature_file, dobAd, values.documents.signature_id || undefined),
  };

  const other = docObj(values.documents.other_file || "", dobAd, values.documents.other_id || undefined);
  if (other) docs.other = other;

  return {
    role: values.role,
    user: {
      first_name: values.user.first_name,
      middle_name: values.user.middle_name || "",
      last_name: values.user.last_name,
      phone: formatPhoneForApi(values.user.phone),
      email: values.user.email || "",
    },
    profile: {
      date_of_birth_ad: dobAd,
      date_of_birth_bs: values.profile.date_of_birth_bs,
      gender: values.profile.gender,
      blood_group: values.profile.blood_group,
      nationality: values.profile.nationality,
      religion: values.profile.religion,
      mother_tongue: values.profile.mother_tongue,
      citizenship_no: values.profile.citizenship_no || "",
      pan_no: values.profile.pan_no || "",
    },
    addresses,
    documents: docs,
  };
}

export function StaffFormPage(props: { mode: "create" | "edit" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = props.mode === "edit" ? searchParams.get("user_id") || "" : "";
  const qc = useQueryClient();

  const [uploadBusy, setUploadBusy] = React.useState<Record<string, boolean>>({});
  const setBusy = React.useCallback((key: string, busy: boolean) => {
    setUploadBusy((prev) => (prev[key] === busy ? prev : { ...prev, [key]: busy }));
  }, []);
  const externallyBlocked = React.useMemo(() => Object.values(uploadBusy).some(Boolean), [uploadBusy]);

  const detailQuery = useQuery({
    queryKey: ["staff", "detail", id || null],
    enabled: props.mode === "edit" && Boolean(id),
    queryFn: async () => {
      const res = await api.get<StaffEntity>(DETAIL_URL(id));
      return (res.data as any).data ?? res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: StaffValues) => {
      const res = await api.post(LIST_URL, toPayload(values));
      return res.data as any;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["staff", "list"] });
      router.push("/staff-enrollment");
      router.refresh();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: StaffValues) => {
      const res = await api.put(DETAIL_URL(id), toPayload(values));
      return res.data as any;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["staff", "list"] });
      await qc.invalidateQueries({ queryKey: ["staff", "detail", id] });
      router.push("/staff-enrollment");
      router.refresh();
    },
  });

  const blocked = detailQuery.isFetching || createMutation.isPending || updateMutation.isPending;

  const entity = detailQuery.data ?? null;

  const defaultValues = React.useMemo<StaffValues>(() => {
    if (props.mode === "edit" && entity) return toDefaults(entity);
    return createDefaults;
  }, [props.mode, entity]);

  const resetKey = React.useMemo(() => {
    if (props.mode === "create") return "create";
    return entity ? `edit-${id}-ready` : `edit-${id}-loading`;
  }, [props.mode, entity, id]);

  // if your backend returns expanded file_url somewhere, wire them here (same idea as students)
  const initialUrls = React.useMemo(() => {
    const docsObj = normalizeProfileDocuments(entity?.profile?.documents);
    // file can be uuid only => no preview URL; if expanded, use file.file_url
    const url = (v: any) => (v && typeof v === "object" ? (v as FileEntity).file_url ?? null : null);
    return {
      doc_photo: url(docsObj?.photo?.file),
      doc_cf: url(docsObj?.citizenship_front?.file),
      doc_cb: url(docsObj?.citizenship_back?.file),
      doc_pan: url(docsObj?.pan?.file),
      doc_sig: url(docsObj?.signature?.file),
      doc_other: url(docsObj?.other?.file),
    };
  }, [entity]);

  const title = props.mode === "create" ? "Add Staff" : "Update Staff";

  return (
    <PageShell
      title={title}
      description={props.mode === "create" ? "Create a new staff user." : "Update staff user."}
      actions={
        <Button variant="outline" asChild>
          <Link href="/staff-enrollment">Back</Link>
        </Button>
      }
    >
      <FormWizard
        schema={staffSchema}
        defaultValues={defaultValues}
        resetKey={resetKey}
        blocked={blocked}
        externallyBlocked={externallyBlocked}
        submitLoading={createMutation.isPending || updateMutation.isPending}
        submitLabel={props.mode === "create" ? "Create" : "Update"}
        disableSubmitUntilDirty
        onSubmit={async (values, methods) => {
          try {
            if (props.mode === "create") await createMutation.mutateAsync(values);
            else await updateMutation.mutateAsync(values);
          } catch (error) {
            handleFormError(error, { setError: methods.setError });
          }
        }}
        render={(methods) => {
          const dobBs = methods.watch("profile.date_of_birth_bs");

          React.useEffect(() => {
            if (dobBs) convertBsToAd(dobBs);
          }, [dobBs]);

          return (
            <div className="space-y-6">
              {/* ROLE */}
              <div className="rounded-lg border p-4 space-y-4">
                <div className="font-medium">Role</div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Controller
                    control={methods.control}
                    name={"role" as any}
                    render={({ field, fieldState }) => (
                      <SelectField
                        control={methods.control}
                        name={"role" as any}
                        label="Staff Role"
                        required
                        disabled={blocked}
                        options={roleOptions}
                      />
                    )}
                  />
                </div>
              </div>

              {/* USER */}
              <div className="rounded-lg border p-4 space-y-4">
                <div className="font-medium">User Information</div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <InputField
                    label="First name"
                    required
                    disabled={blocked}
                    placeholder="First name"
                    {...methods.register("user.first_name")}
                    error={methods.formState.errors.user?.first_name as any}
                  />
                  <InputField
                    label="Middle name"
                    disabled={blocked}
                    placeholder="Middle name"
                    {...methods.register("user.middle_name")}
                    error={methods.formState.errors.user?.middle_name as any}
                  />
                  <InputField
                    label="Last name"
                    required
                    placeholder="Last name"
                    disabled={blocked}
                    {...methods.register("user.last_name")}
                    error={methods.formState.errors.user?.last_name as any}
                  />
                  <InputField
                    label="Phone"
                    required
                    disabled={blocked}
                    placeholder="98XXXXXXXX"
                    {...methods.register("user.phone")}
                    error={methods.formState.errors.user?.phone as any}
                  />
                  <InputField
                    label="Email (optional)"
                    disabled={blocked}
                    placeholder="name@domain.com"
                    {...methods.register("user.email")}
                    error={methods.formState.errors.user?.email as any}
                  />
                </div>
              </div>

              {/* PROFILE */}
              <div className="rounded-lg border p-4 space-y-4">
                <div className="font-medium">Profile Information</div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <NepaliBsDatePickerField
                    control={methods.control}
                    name={"profile.date_of_birth_bs" as any}
                    label="Date of birth (BS)"
                    disabled={blocked}
                    required
                  />

                  <GenderSelectField control={methods.control} name={"profile.gender" as any} required disabled={blocked} />
                  <BloodGroupSelectField
                    control={methods.control}
                    name={"profile.blood_group" as any}
                    required
                    disabled={blocked}
                  />
                  <NationalitySelectField
                    control={methods.control}
                    name={"profile.nationality" as any}
                    required
                    disabled={blocked}
                  />
                  <ReligionSelectField
                    control={methods.control}
                    name={"profile.religion" as any}
                    required
                    disabled={blocked}
                  />
                  <MotherTongueSelectField
                    control={methods.control}
                    name={"profile.mother_tongue" as any}
                    required
                    disabled={blocked}
                  />

                  <InputField
                    label="Citizenship no (optional)"
                    disabled={blocked}
                    {...methods.register("profile.citizenship_no")}
                    error={methods.formState.errors.profile?.citizenship_no as any}
                  />
                  <InputField
                    label="PAN no (optional)"
                    disabled={blocked}
                    {...methods.register("profile.pan_no")}
                    error={methods.formState.errors.profile?.pan_no as any}
                  />
                </div>
              </div>

              {/* ADDRESSES */}
              <div className="space-y-6">
                <NepalAddressFields
                  title="Permanent Address"
                  control={methods.control}
                  register={methods.register}
                  setValue={methods.setValue}
                  watch={methods.watch}
                  errors={methods.formState.errors}
                  disabled={blocked}
                  baseName={"addresses.0" as any}
                />

                <NepalAddressFields
                  title="Temporary Address"
                  control={methods.control}
                  register={methods.register}
                  setValue={methods.setValue}
                  watch={methods.watch}
                  errors={methods.formState.errors}
                  disabled={blocked}
                  baseName={"addresses.1" as any}
                />
              </div>

              {/* DOCUMENTS */}
              <div className="rounded-lg border p-4 space-y-4">
                <div className="font-medium">Documents</div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Controller
                    control={methods.control}
                    name="documents.photo_file"
                    render={({ field, fieldState }) => (
                      <ImagePickerField
                        title="Photo"
                        required
                        value={field.value || null}
                        initialUri={initialUrls.doc_photo}
                        onChange={(id) => field.onChange(id)}
                        error={fieldState.error as any}
                        onUploadStatusChange={(busy) => setBusy("doc_photo", busy)}
                      />
                    )}
                  />
                  <Controller
                    control={methods.control}
                    name="documents.signature_file"
                    render={({ field, fieldState }) => (
                      <ImagePickerField
                        title="Signature"
                        required
                        value={field.value || null}
                        initialUri={initialUrls.doc_sig}
                        onChange={(id) => field.onChange(id)}
                        error={fieldState.error as any}
                        onUploadStatusChange={(busy) => setBusy("doc_sig", busy)}
                      />
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Controller
                    control={methods.control}
                    name="documents.citizenship_front_file"
                    render={({ field, fieldState }) => (
                      <ImagePickerField
                        title="Citizenship (Front)"
                        required
                        value={field.value || null}
                        initialUri={initialUrls.doc_cf}
                        onChange={(id) => field.onChange(id)}
                        error={fieldState.error as any}
                        onUploadStatusChange={(busy) => setBusy("doc_cf", busy)}
                      />
                    )}
                  />
                  <Controller
                    control={methods.control}
                    name="documents.citizenship_back_file"
                    render={({ field, fieldState }) => (
                      <ImagePickerField
                        title="Citizenship (Back)"
                        required
                        value={field.value || null}
                        initialUri={initialUrls.doc_cb}
                        onChange={(id) => field.onChange(id)}
                        error={fieldState.error as any}
                        onUploadStatusChange={(busy) => setBusy("doc_cb", busy)}
                      />
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Controller
                    control={methods.control}
                    name="documents.pan_file"
                    render={({ field, fieldState }) => (
                      <ImagePickerField
                        title="PAN"
                        required
                        value={field.value || null}
                        initialUri={initialUrls.doc_pan}
                        onChange={(id) => field.onChange(id)}
                        error={fieldState.error as any}
                        onUploadStatusChange={(busy) => setBusy("doc_pan", busy)}
                      />
                    )}
                  />
                  <Controller
                    control={methods.control}
                    name="documents.other_file"
                    render={({ field, fieldState }) => (
                      <ImagePickerField
                        title="Other (optional)"
                        value={field.value || null}
                        initialUri={initialUrls.doc_other}
                        onChange={(id) => field.onChange(id)}
                        error={fieldState.error as any}
                        onUploadStatusChange={(busy) => setBusy("doc_other", busy)}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          );
        }}
      />
    </PageShell>
  );
}

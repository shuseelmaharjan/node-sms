"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { ImagePickerField } from "@/components/form/ImagePickerField";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { managementProfileApi } from "../../apis/management-profile.api";
import { useStudentProfileCache } from "../../hooks/use-student-profile-cache";
import {
  documentSchema,
  type DocumentValues,
} from "../../schema/management-profile.schema";
import type { ManagedDocument } from "../../types/management-profile.types";
import { applyManagementApiErrors } from "../../utils/management-form-error";
import { ProfileFormDialog } from "./profile-form-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  userId: string;
  role?: string | null;
  document: ManagedDocument | null;
  existingDocuments?: ManagedDocument[];
};

type DocumentTypeOption = {
  value: string;
  label: string;
  optional?: boolean;
};

const ALL_DOCUMENT_TYPES: DocumentTypeOption[] = [
  {
    value: "photo",
    label: "Photo",
  },
  {
    value: "citizenship_front",
    label: "Citizenship Front",
  },
  {
    value: "citizenship_back",
    label: "Citizenship Back",
  },
  {
    value: "birth_certificate",
    label: "Birth Certificate",
  },
  {
    value: "pan",
    label: "PAN",
  },
  {
    value: "passport",
    label: "Passport",
  },
  {
    value: "registration",
    label: "Registration",
  },
  {
    value: "transfer_certificate",
    label: "Transfer Certificate",
    optional: true,
  },
  {
    value: "marksheet",
    label: "Marksheet",
    optional: true,
  },
  {
    value: "signature",
    label: "Signature",
  },
  {
    value: "other",
    label: "Other",
  },
];

const STUDENT_DOCUMENT_TYPES: DocumentTypeOption[] = [
  {
    value: "photo",
    label: "Photo",
  },
  {
    value: "birth_certificate",
    label: "Birth Certificate",
  },
  {
    value: "transfer_certificate",
    label: "Transfer Certificate",
    optional: true,
  },
  {
    value: "marksheet",
    label: "Marksheet",
    optional: true,
  },
];

const DOCUMENT_TYPES_WITH_DETAILS = new Set([
  "birth_certificate",
  "pan",
  "passport",
  "registration",
  "transfer_certificate",
  "marksheet",
  "other",
]);

const DOCUMENT_TYPES_WITH_EXPIRY = new Set([
  "passport",
]);

function normalizeRole(role?: string | null) {
  return String(role ?? "")
    .trim()
    .toLowerCase();
}

function getTodayDateString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeDocumentValues(
  values: Partial<DocumentValues>
): DocumentValues {
  const documentType = String(
    values.document_type ?? ""
  ).trim();

  const showDetails =
    DOCUMENT_TYPES_WITH_DETAILS.has(
      documentType
    );

  const showExpiry =
    DOCUMENT_TYPES_WITH_EXPIRY.has(
      documentType
    );

  return {
    document_type: documentType,
    file: String(values.file ?? "").trim(),

    issued_by: showDetails
      ? String(values.issued_by ?? "").trim()
      : "",

    issued_date: showDetails
      ? String(values.issued_date ?? "").trim()
      : "",

    expiry_date: showExpiry
      ? String(values.expiry_date ?? "").trim()
      : "",

    remarks: showDetails
      ? String(values.remarks ?? "").trim()
      : "",
  };
}

function documentValuesAreEqual(
  first: DocumentValues,
  second: DocumentValues
) {
  return (
    first.document_type ===
      second.document_type &&
    first.file === second.file &&
    first.issued_by === second.issued_by &&
    first.issued_date ===
      second.issued_date &&
    first.expiry_date ===
      second.expiry_date &&
    first.remarks === second.remarks
  );
}

export function DocumentEditModal({
  open,
  onOpenChange,
  studentId,
  userId,
  role,
  document,
  existingDocuments = [],
}: Props) {
  const [uploading, setUploading] =
    useState(false);

  const cache = useStudentProfileCache(
    studentId,
    userId
  );

  const editing = Boolean(document?.id);

  const isStudent =
    normalizeRole(role) === "student";

  const allowedDocumentTypes =
    useMemo(() => {
      const source = isStudent
        ? STUDENT_DOCUMENT_TYPES
        : ALL_DOCUMENT_TYPES;

      const usedTypes = new Set(
        existingDocuments
          .filter(
            (item) =>
              item.id !== document?.id
          )
          .map(
            (item) =>
              item.document_type
          )
      );

      return source.filter(
        (option) =>
          option.value ===
            document?.document_type ||
          !usedTypes.has(option.value)
      );
    }, [
      document?.document_type,
      document?.id,
      existingDocuments,
      isStudent,
    ]);

  const defaults =
    useMemo<DocumentValues>(
      () =>
        normalizeDocumentValues({
          document_type:
            document?.document_type ?? "",

          file:
            document?.file?.id ?? "",

          issued_by:
            document?.issued_by ?? "",

          issued_date:
            document?.issued_date ?? "",

          expiry_date:
            document?.expiry_date ?? "",

          remarks:
            document?.remarks ?? "",
        }),
      [
        document?.document_type,
        document?.file?.id,
        document?.issued_by,
        document?.issued_date,
        document?.expiry_date,
        document?.remarks,
      ]
    );

  const methods = useForm<DocumentValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: defaults,
    mode: "onChange",
  });

  const selectedDocumentType = useWatch({
    control: methods.control,
    name: "document_type",
  });

  const watchedValues = useWatch({
    control: methods.control,
  });

  const showDocumentDetails =
    DOCUMENT_TYPES_WITH_DETAILS.has(
      selectedDocumentType ?? ""
    );

  const showExpiryDate =
    DOCUMENT_TYPES_WITH_EXPIRY.has(
      selectedDocumentType ?? ""
    );

  const currentValues =
    useMemo<DocumentValues>(
      () =>
        normalizeDocumentValues({
          ...defaults,
          ...watchedValues,
        }),
      [defaults, watchedValues]
    );

  const normalizedDefaults = useMemo(
    () =>
      normalizeDocumentValues(
        defaults
      ),
    [defaults]
  );

  const hasChanges = useMemo(
    () =>
      !documentValuesAreEqual(
        currentValues,
        normalizedDefaults
      ),
    [
      currentValues,
      normalizedDefaults,
    ]
  );

  const isCurrentFormValid = useMemo(
    () =>
      documentSchema.safeParse(
        currentValues
      ).success,
    [currentValues]
  );

  useEffect(() => {
    if (!open) return;

    methods.reset(defaults, {
      keepDefaultValues: false,
    });

    methods.clearErrors();
    setUploading(false);
  }, [defaults, methods, open]);

  const mutation = useMutation({
    mutationFn: async (
      values: DocumentValues
    ) => {
      const payload =
        normalizeDocumentValues(values);

      if (editing && document?.id) {
        return managementProfileApi.updateDocument(
          userId,
          document.id,
          payload
        );
      }

      return managementProfileApi.createDocument(
        userId,
        payload
      );
    },

    onSuccess: async (
      updatedDocument
    ) => {
      cache.setDocument(updatedDocument);

      methods.reset(
        normalizeDocumentValues({
          document_type:
            updatedDocument.document_type ??
            "",

          file:
            updatedDocument.file?.id ?? "",

          issued_by:
            updatedDocument.issued_by ?? "",

          issued_date:
            updatedDocument.issued_date ??
            "",

          expiry_date:
            updatedDocument.expiry_date ??
            "",

          remarks:
            updatedDocument.remarks ?? "",
        }),
        {
          keepDefaultValues: false,
        }
      );

      methods.clearErrors();

      onOpenChange(false);

      toast.success(
        editing
          ? "Document updated successfully"
          : "Document added successfully"
      );

      void cache.refresh();
    },

    onError: (error) => {
      toast.error(
        applyManagementApiErrors(
          error,
          methods
        )
      );
    },
  });

  const busy =
    uploading || mutation.isPending;

  const handleOpenChange = (
    nextOpen: boolean
  ) => {
    if (!nextOpen && busy) return;

    if (!nextOpen) {
      methods.reset(defaults, {
        keepDefaultValues: false,
      });

      methods.clearErrors();
      setUploading(false);
    }

    onOpenChange(nextOpen);
  };

  const handleDocumentTypeChange = (
    value: string
  ) => {
    methods.setValue(
      "document_type",
      value,
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      }
    );

    const hasDetails =
      DOCUMENT_TYPES_WITH_DETAILS.has(
        value
      );

    const hasExpiry =
      DOCUMENT_TYPES_WITH_EXPIRY.has(
        value
      );

    if (!hasDetails) {
      methods.setValue(
        "issued_by",
        "",
        {
          shouldDirty: true,
          shouldValidate: true,
        }
      );

      methods.setValue(
        "issued_date",
        "",
        {
          shouldDirty: true,
          shouldValidate: true,
        }
      );

      methods.setValue(
        "remarks",
        "",
        {
          shouldDirty: true,
          shouldValidate: true,
        }
      );
    }

    if (!hasExpiry) {
      methods.setValue(
        "expiry_date",
        "",
        {
          shouldDirty: true,
          shouldValidate: true,
        }
      );
    }

    methods.clearErrors([
      "document_type",
      "issued_by",
      "issued_date",
      "expiry_date",
      "remarks",
    ]);
  };

  const canSubmit =
    hasChanges &&
    isCurrentFormValid &&
    !busy;

  return (
    <Form {...methods}>
      <ProfileFormDialog
        open={open}
        onOpenChange={
          handleOpenChange
        }
        title={
          editing
            ? "Edit document"
            : "Add document"
        }
        description="Upload the document image and maintain its issue details."
        submitLabel={
          editing
            ? "Update document"
            : "Add document"
        }
        busy={busy}
        canSubmit={canSubmit}
        onSubmit={methods.handleSubmit(
          async (values) => {
            await mutation.mutateAsync(
              values
            );
          }
        )}
        contentClassName="max-w-3xl"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={methods.control}
            name="document_type"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>
                  Document type
                  <span className="text-destructive">
                    {" "}
                    *
                  </span>
                </FormLabel>

                <Select
                  value={field.value ?? ""}
                  disabled={busy}
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleDocumentTypeChange(
                      value
                    );
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent>
                    {allowedDocumentTypes.map(
                      (option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                        >
                          <span className="flex items-center gap-2">
                            <span>
                              {
                                option.label
                              }
                            </span>

                            {option.optional ? (
                              <span className="text-xs text-muted-foreground">
                                Optional
                              </span>
                            ) : null}
                          </span>
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={methods.control}
            name="file"
            render={({
              field,
              fieldState,
            }) => (
              <div className="md:col-span-2">
                <ImagePickerField
                  title="Document image"
                  hint="Select document image"
                  required
                  initialUri={
                    document?.file
                      ?.file_url ?? null
                  }
                  value={field.value}
                  onChange={(fileId) => {
                    const nextValue =
                      fileId ?? "";

                    field.onChange(
                      nextValue
                    );

                    methods.setValue(
                      "file",
                      nextValue,
                      {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      }
                    );

                    void methods.trigger(
                      "file"
                    );
                  }}
                  error={
                    fieldState.error
                  }
                  onUploadStatusChange={
                    setUploading
                  }
                  deleteOnRemove={false}
                  disabled={
                    mutation.isPending
                  }
                />
              </div>
            )}
          />

          {showDocumentDetails ? (
            <>
              <FormField
                control={methods.control}
                name="issued_by"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>
                      Issued by
                    </FormLabel>

                    <FormControl>
                      <Input
                        {...field}
                        value={
                          field.value ?? ""
                        }
                        disabled={busy}
                        placeholder="Issuing authority"
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={methods.control}
                name="issued_date"
                render={({ field }) => (
                  <FormItem
                    className={
                      showExpiryDate
                        ? ""
                        : "md:col-span-2"
                    }
                  >
                    <FormLabel>
                      Issued date
                    </FormLabel>

                    <FormControl>
                      <Input
                        {...field}
                        value={
                          field.value ?? ""
                        }
                        type="date"
                        disabled={busy}
                        max={getTodayDateString()}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {showExpiryDate ? (
                <FormField
                  control={methods.control}
                  name="expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Expiry date
                      </FormLabel>

                      <FormControl>
                        <Input
                          {...field}
                          value={
                            field.value ?? ""
                          }
                          type="date"
                          disabled={busy}
                          min={
                            methods.watch(
                              "issued_date"
                            ) || undefined
                          }
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              <FormField
                control={methods.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>
                      Remarks
                    </FormLabel>

                    <FormControl>
                      <Textarea
                        {...field}
                        value={
                          field.value ?? ""
                        }
                        rows={3}
                        disabled={busy}
                        placeholder="Optional document remarks"
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          ) : null}
        </div>
      </ProfileFormDialog>
    </Form>
  );
}
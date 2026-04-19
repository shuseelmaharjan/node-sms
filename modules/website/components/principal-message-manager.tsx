"use client";

import * as React from "react";
import { z } from "zod";
import { Controller } from "react-hook-form";
import type { JSONContent } from "@tiptap/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { api } from "@/api";
import type { PaginatedResponse } from "@/types/api";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/fields/InputField";
import { ImagePickerField } from "@/components/form/ImagePickerField";
import { RichTextEditor } from "@/components/fields/RichTextEditor";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import { handleFormError } from "@/lib/handleFormError";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type UploadedImageEntity = {
  id: string;
  file_url: string;
  download_url?: string;
  file_type: string;
  original_name?: string;
  size_bytes?: number;
  is_temporary?: boolean;
  meta?: any;
  uploaded_at?: string;
};

type PrincipalMessageEntity = {
  id: string;
  title: string;
  message?: string;
  image?: UploadedImageEntity | null;
  school_id?: string;
  created_at?: string;
  created_by_id?: string;
  updated_at?: string;
  updated_by_id?: string;
};

const PRINCIPAL_MESSAGES_URL = "/api/v1/principal-messages/";
const PRINCIPAL_MESSAGE_DETAIL_URL = (id: string) => `/api/v1/principal-messages/${id}/`;

const richTextJsonSchema: z.ZodType<JSONContent | null> = z.object({}).passthrough().nullable();

const principalMessageSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),

  message: richTextJsonSchema,

  image_id: z.string().uuid("Image is required"),
});

type PrincipalMessageValues = z.infer<typeof principalMessageSchema>;

type PrincipalMessagePayload = {
  title: string;
  message: string;
  image_id: string;
};

function createEmptyRichText(): JSONContent {
  return {
    type: "doc",
    content: [{ type: "paragraph" }],
  };
}

function parseRichText(value?: string | null): JSONContent {
  if (!value) return createEmptyRichText();

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") {
      return parsed as JSONContent;
    }
    return createEmptyRichText();
  } catch {
    // fallback for old plain-text records
    return {
      type: "doc",
      content: value.trim()
        ? [
            {
              type: "paragraph",
              content: [{ type: "text", text: value }],
            },
          ]
        : [{ type: "paragraph" }],
    };
  }
}

function richTextToPlainText(value?: JSONContent | null): string {
  if (!value) return "";

  const walk = (node: any): string[] => {
    if (!node) return [];
    if (node.type === "text" && typeof node.text === "string") return [node.text];
    if (Array.isArray(node.content)) return node.content.flatMap(walk);
    return [];
  };

  return walk(value).join(" ").replace(/\s+/g, " ").trim();
}

function getPrincipalMessageErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;

  const clean = (msg: unknown) => {
    const s = String(msg ?? "").trim();
    return s.startsWith("__all__:") ? s.replace(/^__all__:\s*/, "") : s;
  };

  if (data?.detail) return clean(data.detail);

  if (Array.isArray(data?.__all__) && data.__all__[0]) {
    return clean(data.__all__[0]);
  }

  if (data && typeof data === "object") {
    for (const [, value] of Object.entries(data)) {
      if (Array.isArray(value) && value[0]) return clean(value[0]);
      if (typeof value === "string") return clean(value);
    }
  }

  return fallback;
}

function getDefaultValues(entity?: PrincipalMessageEntity | null): PrincipalMessageValues {
  if (!entity) {
    return {
      title: "",
      message: createEmptyRichText(),
      image_id: "",
    };
  }

  return {
    title: entity.title ?? "",
    message: parseRichText(entity.message),
    image_id: entity.image?.id ?? "",
  };
}

function toPayload(values: PrincipalMessageValues): PrincipalMessagePayload {
  return {
    title: values.title.trim(),
    message: JSON.stringify(values.message ?? createEmptyRichText()),
    image_id: values.image_id,
  };
}

type FormMode = "create" | "edit";

export function PrincipalMessageManager() {
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [mode, setMode] = React.useState<FormMode>("create");
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [deleteTarget, setDeleteTarget] = React.useState<PrincipalMessageEntity | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const listQuery = useQuery<PaginatedResponse<PrincipalMessageEntity>>({
    queryKey: ["principal-messages", "list"],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<PrincipalMessageEntity>>(PRINCIPAL_MESSAGES_URL, {
        params: {
          page: 1,
          page_size: 10,
        },
      });
      return res.data;
    },
  });

  const detailQuery = useQuery<PrincipalMessageEntity>({
    queryKey: ["principal-messages", "detail", selectedId || null],
    enabled: dialogOpen && mode === "edit" && Boolean(selectedId),
    queryFn: async () => {
      const res = await api.get<PrincipalMessageEntity>(PRINCIPAL_MESSAGE_DETAIL_URL(selectedId));
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: PrincipalMessageValues) => {
      const res = await api.post(PRINCIPAL_MESSAGES_URL, toPayload(values));
      return res.data;
    },
    onSuccess: async () => {
      toast.success("Principal message created");
      setDialogOpen(false);
      await qc.invalidateQueries({ queryKey: ["principal-messages", "list"] });
    },
    onError: (error: any) => {
      toast.error(getPrincipalMessageErrorMessage(error, "Failed to create principal message"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: PrincipalMessageValues) => {
      const res = await api.put(PRINCIPAL_MESSAGE_DETAIL_URL(selectedId), toPayload(values));
      return res.data;
    },
    onSuccess: async () => {
      toast.success("Principal message updated");
      setDialogOpen(false);
      await qc.invalidateQueries({ queryKey: ["principal-messages", "list"] });
      await qc.invalidateQueries({ queryKey: ["principal-messages", "detail", selectedId] });
    },
    onError: (error: any) => {
      toast.error(getPrincipalMessageErrorMessage(error, "Failed to update principal message"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(PRINCIPAL_MESSAGE_DETAIL_URL(id));
    },
    onSuccess: async () => {
      toast.success("Principal message deleted");
      setDeleteTarget(null);
      await qc.invalidateQueries({ queryKey: ["principal-messages", "list"] });
    },
    onError: (error: any) => {
      toast.error(getPrincipalMessageErrorMessage(error, "Failed to delete principal message"));
    },
  });

  const rows = listQuery.data?.results ?? [];
  const count = listQuery.data?.count ?? rows.length;
  const hasAny = rows.length > 0;
  const hasMultiple = rows.length > 1;

  const currentEntity = detailQuery.data ?? null;

  const defaultValues = React.useMemo<PrincipalMessageValues>(() => {
    if (mode === "edit") return getDefaultValues(currentEntity);
    return getDefaultValues(null);
  }, [mode, currentEntity]);

  const resetKey = React.useMemo(() => {
    if (mode === "create") return "principal-message-create";
    return currentEntity
      ? `principal-message-edit-${selectedId}-${currentEntity.updated_at ?? "ready"}`
      : `principal-message-edit-${selectedId}-loading`;
  }, [mode, currentEntity, selectedId]);

  const blocked =
    listQuery.isFetching ||
    detailQuery.isFetching ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    uploading;

  const openCreate = () => {
    setMode("create");
    setSelectedId("");
    setDialogOpen(true);
  };

  const openEdit = (item: PrincipalMessageEntity) => {
    setMode("edit");
    setSelectedId(item.id);
    setDialogOpen(true);
  };

  const closeDialog = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedId("");
      setMode("create");
    }
  };

  return (
    <>
      <PageShell
        title="Principal Message"
        description="Manage the principal's message shown on the website."
        actions={
          !hasAny ? (
            <Button type="button" onClick={openCreate} disabled={blocked}>
              <Plus className="mr-2 h-4 w-4" />
              Add Message
            </Button>
          ) : null
        }
      >
        <div className="space-y-6">
          {hasMultiple ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              More than one principal message was returned by the API. This module is designed for a single record.
              Please clean up the extra records. Add action has been hidden intentionally.
            </div>
          ) : null}

          {listQuery.isLoading ? (
            <div className="rounded-lg border p-6 text-sm text-muted-foreground">
              Loading principal message...
            </div>
          ) : listQuery.isError ? (
            <div className="rounded-lg border p-6 text-sm text-destructive">
              Failed to load principal message.
            </div>
          ) : !hasAny ? (
            <div className="rounded-lg border p-8">
              <div className="space-y-2">
                <div className="text-lg font-semibold">No principal message found</div>
                <div className="text-sm text-muted-foreground">
                  Create one principal message to display it on the website.
                </div>
                <div className="pt-2">
                  <Button type="button" onClick={openCreate} disabled={blocked}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Message
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {rows.map((item) => {
                const preview = richTextToPlainText(parseRichText(item.message));

                return (
                  <div key={item.id} className="overflow-hidden rounded-xl border bg-background">
                    <div className="flex flex-col gap-6 p-6 md:flex-row">
                      <div className="w-full md:w-[280px]">
                        <div className="overflow-hidden rounded-lg border bg-muted">
                          {item.image?.file_url ? (
                            <img
                              src={item.image.file_url}
                              alt={item.title}
                              className="h-[220px] w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                              No image
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 space-y-4">
                        <div className="space-y-1">
                          <div className="text-2xl font-semibold">{item.title}</div>
                          <div className="text-xs text-muted-foreground">
                            Updated: {item.updated_at ?? "-"}
                          </div>
                        </div>

                        <Separator />

                        <div className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                          {preview || "No message provided."}
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => openEdit(item)}
                            disabled={blocked}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>

                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => setDeleteTarget(item)}
                            disabled={blocked}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {count > rows.length ? (
                <div className="text-xs text-muted-foreground">
                  API count: {count}. Loaded: {rows.length}.
                </div>
              ) : null}
            </div>
          )}
        </div>
      </PageShell>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Add Principal Message" : "Update Principal Message"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Create the principal message for the website."
                : "Update the principal message details."}
            </DialogDescription>
          </DialogHeader>

          <FormWizard
            schema={principalMessageSchema}
            defaultValues={defaultValues}
            resetKey={resetKey}
            blocked={blocked}
            externallyBlocked={uploading}
            submitLabel={mode === "create" ? "Create" : "Update"}
            submitLoading={createMutation.isPending || updateMutation.isPending}
            disableSubmitUntilDirty={mode === "edit"}
            onCancel={() => closeDialog(false)}
            onSubmit={async (values, methods) => {
              try {
                if (mode === "create") await createMutation.mutateAsync(values);
                else await updateMutation.mutateAsync(values);
              } catch (error) {
                handleFormError(error, { setError: methods.setError });
              }
            }}
            render={(methods) => {
              const imageInitialUri =
                mode === "edit" ? currentEntity?.image?.file_url ?? null : null;

              return (
                <div className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                      <InputField
                        label="Principal Name"
                        required
                        placeholder="Enter principal name"
                        disabled={blocked}
                        {...methods.register("title")}
                        error={methods.formState.errors.title as any}
                      />

                      <Controller
                        control={methods.control}
                        name="message"
                        render={({ field, fieldState }) => (
                          <RichTextEditor
                            label="Message"
                            required
                            value={field.value}
                            onChange={field.onChange}
                            error={fieldState.error}
                            placeholder="Write principal message..."
                            disabled={blocked}
                            minHeight="20rem"
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-6">
                      <Controller
                        control={methods.control}
                        name="image_id"
                        render={({ field, fieldState }) => (
                          <ImagePickerField
                            title="Principal Image"
                            required
                            hint="PNG, JPG up to ~5MB"
                            value={field.value}
                            initialUri={imageInitialUri}
                            onChange={(value) => field.onChange(value || "")}
                            error={fieldState.error}
                            onUploadStatusChange={setUploading}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
              );
            }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        loading={deleteMutation.isPending}
        title="Delete principal message?"
        description="This action can’t be undone."
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
        }}
      />
    </>
  );
}
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
};

type AboutUsEntity = {
    id: string;
    title: string;
    description?: string;
    image?: UploadedImageEntity | null;
    updated_at?: string;
};

const ABOUT_URL = "/api/v1/about-us/";
const ABOUT_DETAIL_URL = (id: string) => `/api/v1/about-us/${id}/`;

const richTextSchema: z.ZodType<JSONContent | null> = z.object({}).passthrough().nullable();

const schema = z.object({
    title: z.string().min(1, "Title is required"),
    description: richTextSchema,
    image_id: z.string().uuid("Image is required"),
});

type FormValues = z.infer<typeof schema>;

function createEmpty(): JSONContent {
    return { type: "doc", content: [{ type: "paragraph" }] };
}

function parse(value?: string | null): JSONContent {
    if (!value) return createEmpty();
    try {
        return JSON.parse(value);
    } catch {
        return {
            type: "doc",
            content: [{ type: "paragraph", content: [{ type: "text", text: value }] }],
        };
    }
}

function toPayload(values: FormValues) {
    return {
        title: values.title.trim(),
        description: JSON.stringify(values.description ?? createEmpty()),
        image_id: values.image_id,
    };
}

function getDefault(entity?: AboutUsEntity | null): FormValues {
    if (!entity) {
        return {
            title: "",
            description: createEmpty(),
            image_id: "",
        };
    }

    return {
        title: entity.title ?? "",
        description: parse(entity.description),
        image_id: entity.image?.id ?? "",
    };
}

function toPlainText(json?: JSONContent | null): string {
    if (!json) return "";
    const walk = (n: any): string[] =>
        n?.type === "text"
            ? [n.text]
            : Array.isArray(n?.content)
                ? n.content.flatMap(walk)
                : [];
    return walk(json).join(" ").trim();
}

export function AboutUsManager() {
    const qc = useQueryClient();

    const [open, setOpen] = React.useState(false);
    const [mode, setMode] = React.useState<"create" | "edit">("create");
    const [selectedId, setSelectedId] = React.useState("");
    const [deleteTarget, setDeleteTarget] = React.useState<AboutUsEntity | null>(null);
    const [uploading, setUploading] = React.useState(false);

    const listQuery = useQuery({
        queryKey: ["about-us"],
        queryFn: async () => {
            const res = await api.get<PaginatedResponse<AboutUsEntity>>(ABOUT_URL);
            return res.data;
        },
    });

    const detailQuery = useQuery({
        queryKey: ["about-us", selectedId],
        enabled: open && mode === "edit" && !!selectedId,
        queryFn: async () => {
            const res = await api.get<AboutUsEntity>(ABOUT_DETAIL_URL(selectedId));
            return res.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (v: FormValues) =>
            api.post(ABOUT_URL, toPayload(v)),
        onSuccess: async () => {
            toast.success("About Us created");
            setOpen(false);
            await qc.invalidateQueries({ queryKey: ["about-us"] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (v: FormValues) =>
            api.put(ABOUT_DETAIL_URL(selectedId), toPayload(v)),
        onSuccess: async () => {
            toast.success("About Us updated");
            setOpen(false);
            await qc.invalidateQueries({ queryKey: ["about-us"] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => api.delete(ABOUT_DETAIL_URL(id)),
        onSuccess: async () => {
            toast.success("Deleted");
            setDeleteTarget(null);
            await qc.invalidateQueries({ queryKey: ["about-us"] });
        },
    });

    const rows = listQuery.data?.results ?? [];
    const hasAny = rows.length > 0;
    const hasMultiple = rows.length > 1;

    const current = detailQuery.data ?? null;

    const defaultValues = React.useMemo(
        () => (mode === "edit" ? getDefault(current) : getDefault()),
        [mode, current]
    );

    const blocked =
        listQuery.isFetching ||
        detailQuery.isFetching ||
        createMutation.isPending ||
        updateMutation.isPending ||
        deleteMutation.isPending ||
        uploading;

    return (
        <>
            <PageShell
                title="About Us"
                description="Manage About Us content"
                actions={
                    !hasAny && (
                        <Button onClick={() => { setMode("create"); setOpen(true); }}>
                            <Plus className="mr-2 h-4 w-4" /> Add About Us
                        </Button>
                    )
                }
            >
                <div className="space-y-6">
                    {hasMultiple && (
                        <div className="text-destructive text-sm border p-3 rounded">
                            Multiple records found. Only one is allowed.
                        </div>
                    )}

                    {!hasAny ? (
                        <div className="border p-6 rounded">No data</div>
                    ) : (
                        rows.map((item) => {
                            const preview = toPlainText(parse(item.description));
                            return (
                                <div key={item.id} className="border rounded-xl p-6 space-y-4">
                                    <img src={item.image?.file_url} className="h-56 w-full object-cover rounded" />

                                    <div className="text-xl font-semibold">{item.title}</div>

                                    <Separator />

                                    <div className="text-sm text-muted-foreground">
                                        {preview || "No description"}
                                    </div>

                                    <div className="flex gap-2">
                                        <Button onClick={() => { setMode("edit"); setSelectedId(item.id); setOpen(true); }}>
                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                        </Button>

                                        <Button variant="destructive" onClick={() => setDeleteTarget(item)}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </PageShell>

            {/* FORM MODAL */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>{mode === "create" ? "Add" : "Edit"} About Us</DialogTitle>
                        <DialogDescription>
                            Manage About Us content
                        </DialogDescription>
                    </DialogHeader>

                    <FormWizard
                        schema={schema}
                        defaultValues={defaultValues}
                        blocked={blocked}
                        externallyBlocked={uploading}
                        submitLabel={mode === "create" ? "Create" : "Update"}
                        onSubmit={async (v, m) => {
                            try {
                                if (mode === "create") await createMutation.mutateAsync(v);
                                else await updateMutation.mutateAsync(v);
                            } catch (e) {
                                handleFormError(e, { setError: m.setError });
                            }
                        }}
                        render={(methods) => (
                            <div className="grid gap-6 lg:grid-cols-3">
                                <div className="lg:col-span-2 space-y-6">
                                    <InputField
                                        label="Title"
                                        required
                                        {...methods.register("title")}
                                        error={methods.formState.errors.title as any}
                                    />

                                    <Controller
                                        control={methods.control}
                                        name="description"
                                        render={({ field, fieldState }) => (
                                            <RichTextEditor
                                                label="Description"
                                                required
                                                value={field.value}
                                                onChange={field.onChange}
                                                error={fieldState.error}
                                                minHeight="20rem"
                                            />
                                        )}
                                    />
                                </div>

                                <Controller
                                    control={methods.control}
                                    name="image_id"
                                    render={({ field, fieldState }) => (
                                        <ImagePickerField
                                            title="Image"
                                            required
                                            value={field.value}
                                            initialUri={current?.image?.file_url}
                                            onChange={(v) => field.onChange(v || "")}
                                            error={fieldState.error}
                                            onUploadStatusChange={setUploading}
                                        />
                                    )}
                                />
                            </div>
                        )}
                    />
                </DialogContent>
            </Dialog>

            <ConfirmDeleteDialog
                open={Boolean(deleteTarget)}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
                loading={deleteMutation.isPending}
                title="Delete About Us?"
                description="This action can’t be undone."
                onConfirm={async () => {
                    if (!deleteTarget) return;
                    await deleteMutation.mutateAsync(deleteTarget.id);
                }}
            />
        </>
    );
}
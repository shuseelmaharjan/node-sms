"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Eye,
  FolderOpen,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";

import { api } from "@/api";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/fields/InputField";
import { TextareaField } from "@/components/fields/TextareaField";
import { SelectField } from "@/components/fields/SelectField";
import { FormWizard } from "@/components/form/FormWizard";
import { GalleryPickerField } from "@/components/form/GalleryPickerField";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  galleryGroupSchema,
  galleryImageSchema,
  galleryUploadSchema,
  type GalleryGroupValues,
  type GalleryImageValues,
  type GalleryUploadValues,
} from "../schema/gallery.schema";
import { GalleryViewer } from "@/components/media/GalleryViewer";

type UploadedImageEntity = {
  id: string;
  file_url: string | null;
  download_url?: string | null;
  file_type?: string;
  original_name?: string;
  size_bytes?: number;
  is_temporary?: boolean;
  meta?: Record<string, any> | null;
  uploaded_at?: string;
};

type GalleryGroupEntity = {
  id: string;
  name: string;
  school_id?: string;
  created_at?: string;
  created_by_id?: string;
  updated_at?: string;
  updated_by_id?: string;
};

type GalleryImageEntity = {
  id: string;
  image: UploadedImageEntity | null;
  caption?: string;
  gallery_group_id: string;
  gallery_group_name?: string;
  created_at?: string;
  created_by_id?: string;
  updated_at?: string;
  updated_by_id?: string;
};

type GalleryDeleteTarget =
  | { type: "group"; entity: GalleryGroupEntity }
  | { type: "image"; entity: GalleryImageEntity };

type GroupFormMode =
  | { type: "create" }
  | { type: "edit"; entity: GalleryGroupEntity };

type ImageFormMode =
  | { type: "create" }
  | { type: "edit"; entity: GalleryImageEntity };

const GALLERY_GROUPS_URL = "/api/v1/gallery-groups/";
const GALLERY_GROUP_DETAIL_URL = (id: string) => `/api/v1/gallery-groups/${id}/`;

const GALLERY_IMAGES_URL = "/api/v1/gallery-images/";
const GALLERY_IMAGE_DETAIL_URL = (id: string) => `/api/v1/gallery-images/${id}/`;

function getErrorMessage(error: any, fallback: string): string {
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

function getGroupDefaultValues(entity?: GalleryGroupEntity | null): GalleryGroupValues {
  return {
    name: entity?.name ?? "",
  };
}

function getImageDefaultValues(entity?: GalleryImageEntity | null): GalleryImageValues {
  return {
    image_id: entity?.image?.id ?? "",
    caption: entity?.caption ?? "",
    gallery_group_id: entity?.gallery_group_id ?? "",
  };
}

function getUploadDefaultValues(groupId?: string): GalleryUploadValues {
  return {
    gallery_group_id: groupId ?? "",
    images: [],
  };
}

class AsyncQueue {
  private queue: Array<() => Promise<void>> = [];
  private running = false;

  enqueue(task: () => Promise<void>) {
    this.queue.push(task);
    void this.process();
  }

  private async process() {
    if (this.running) return;
    this.running = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (!task) continue;
      await task();
    }

    this.running = false;
  }
}

const uploadQueue = new AsyncQueue();

export function GalleryManager() {
  const qc = useQueryClient();

  const [selectedGroupId, setSelectedGroupId] = React.useState<string | "all">("all");

  const [groupDialogOpen, setGroupDialogOpen] = React.useState(false);
  const [imageDialogOpen, setImageDialogOpen] = React.useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);

  const [groupFormMode, setGroupFormMode] = React.useState<GroupFormMode>({ type: "create" });
  const [imageFormMode, setImageFormMode] = React.useState<ImageFormMode>({ type: "create" });

  const [deleteTarget, setDeleteTarget] = React.useState<GalleryDeleteTarget | null>(null);
  const [uploadQueueCount, setUploadQueueCount] = React.useState(0);

  const groupsQuery = useQuery({
    queryKey: ["gallery-groups", "list"],
    queryFn: async () => {
      const res = await api.get(GALLERY_GROUPS_URL, {
        params: { page: 1, page_size: 200 },
      });
      return res.data.results as GalleryGroupEntity[];
    },
  });

  const imagesQuery = useQuery({
    queryKey: ["gallery-images", "list"],
    queryFn: async () => {
      const res = await api.get(GALLERY_IMAGES_URL, {
        params: { page: 1, page_size: 1000 },
      });
      return res.data.results as GalleryImageEntity[];
    },
  });

  const groups = groupsQuery.data ?? [];
  const images = imagesQuery.data ?? [];

  React.useEffect(() => {
    if (selectedGroupId === "all") return;
    if (!groups.find((g) => g.id === selectedGroupId)) {
      setSelectedGroupId("all");
    }
  }, [groups, selectedGroupId]);

  const selectedGroup =
    selectedGroupId === "all"
      ? null
      : groups.find((g) => g.id === selectedGroupId) ?? null;

  const filteredImages =
    selectedGroupId === "all"
      ? images
      : images.filter((img) => img.gallery_group_id === selectedGroupId);

  const groupOptions = React.useMemo(
    () => groups.map((group) => ({ value: group.id, label: group.name })),
    [groups]
  );

  const createGroupMutation = useMutation({
    mutationFn: async (values: GalleryGroupValues) => {
      const res = await api.post(GALLERY_GROUPS_URL, values);
      return res.data;
    },
    onSuccess: async () => {
      toast.success("Gallery group created");
      await qc.invalidateQueries({ queryKey: ["gallery-groups", "list"] });
      setGroupDialogOpen(false);
      setGroupFormMode({ type: "create" });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to create gallery group"));
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: GalleryGroupValues }) => {
      const res = await api.put(GALLERY_GROUP_DETAIL_URL(id), values);
      return res.data;
    },
    onSuccess: async () => {
      toast.success("Gallery group updated");
      await qc.invalidateQueries({ queryKey: ["gallery-groups", "list"] });
      setGroupDialogOpen(false);
      setGroupFormMode({ type: "create" });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to update gallery group"));
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(GALLERY_GROUP_DETAIL_URL(id));
    },
    onSuccess: async (_, deletedId) => {
      toast.success("Gallery group deleted");
      await qc.invalidateQueries({ queryKey: ["gallery-groups", "list"] });
      await qc.invalidateQueries({ queryKey: ["gallery-images", "list"] });

      if (selectedGroupId === deletedId) {
        setSelectedGroupId("all");
      }

      setDeleteTarget(null);
      setGroupDialogOpen(false);
      setGroupFormMode({ type: "create" });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to delete gallery group"));
    },
  });

  const createImageMutation = useMutation({
    mutationFn: async (values: GalleryImageValues) => {
      const res = await api.post(GALLERY_IMAGES_URL, values);
      return res.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["gallery-images", "list"] });
    },
    onError: (error: any) => {
      throw error;
    },
  });

  const updateImageMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: GalleryImageValues }) => {
      const res = await api.put(GALLERY_IMAGE_DETAIL_URL(id), values);
      return res.data;
    },
    onSuccess: async () => {
      toast.success("Gallery image updated");
      await qc.invalidateQueries({ queryKey: ["gallery-images", "list"] });
      setImageDialogOpen(false);
      setImageFormMode({ type: "create" });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to update gallery image"));
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(GALLERY_IMAGE_DETAIL_URL(id));
    },
    onSuccess: async () => {
      toast.success("Gallery image deleted");
      await qc.invalidateQueries({ queryKey: ["gallery-images", "list"] });
      setDeleteTarget(null);
      setImageDialogOpen(false);
      setImageFormMode({ type: "create" });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to delete gallery image"));
    },
  });

  const blocked =
    groupsQuery.isFetching ||
    imagesQuery.isFetching ||
    createGroupMutation.isPending ||
    updateGroupMutation.isPending ||
    deleteGroupMutation.isPending ||
    createImageMutation.isPending ||
    updateImageMutation.isPending ||
    deleteImageMutation.isPending;

  const currentGroupEntity =
    groupFormMode.type === "edit" ? groupFormMode.entity : null;

  const currentImageEntity =
    imageFormMode.type === "edit" ? imageFormMode.entity : null;

  const groupResetKey =
    groupFormMode.type === "edit"
      ? `gallery-group-${groupFormMode.entity.id}-${groupFormMode.entity.updated_at ?? "ready"}`
      : "gallery-group-create";

  const imageResetKey =
    imageFormMode.type === "edit"
      ? `gallery-image-${imageFormMode.entity.id}-${imageFormMode.entity.updated_at ?? "ready"}`
      : `gallery-image-create-${selectedGroupId === "all" ? "all" : selectedGroupId}`;

  const uploadResetKey = `gallery-upload-${selectedGroupId === "all" ? "all" : selectedGroupId}`;

  function normalizeImage(file: UploadedImageEntity) {
    return {
      ...file,
      meta: file.meta ?? undefined,
    };
  }

  return (
    <>
      <PageShell
        title="Gallery Management"
        description="Manage gallery groups and images."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setGroupFormMode({ type: "create" });
                setGroupDialogOpen(true);
              }}
              disabled={blocked}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Group
            </Button>

            <Button
              onClick={() => {
                setImageFormMode({ type: "create" });
                setUploadDialogOpen(true);
              }}
              disabled={blocked || groups.length === 0}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Images
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                qc.invalidateQueries({ queryKey: ["gallery-groups", "list"] });
                qc.invalidateQueries({ queryKey: ["gallery-images", "list"] });
              }}
              disabled={blocked}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        }
      >
        {uploadQueueCount > 0 ? (
          <div className="mb-4 rounded-xl border bg-primary/5 px-4 py-3 text-sm">
            Upload queue running: {uploadQueueCount} file(s) pending.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px] border p-6 rounded-2xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">
                  {selectedGroupId === "all"
                    ? "All Gallery Images"
                    : selectedGroup?.name ?? "Gallery"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {filteredImages.length} image(s)
                </div>
              </div>
            </div>

            {imagesQuery.isLoading ? (
              <div className="rounded-2xl border p-8 text-center text-sm text-muted-foreground">
                Loading gallery images...
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="rounded-2xl border p-8 text-center text-sm text-muted-foreground">
                No gallery images found.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {filteredImages.map((item) => (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm"
                  >
                    <div className="aspect-square overflow-hidden bg-muted">
                      {item.image ? (
                        <GalleryViewer
                          file={normalizeImage(item.image)}
                          thumbSize={320}
                          title={
                            item.caption?.trim() ||
                            item.image.original_name ||
                            "Gallery image"
                          }
                          className="h-full w-full rounded-none border-0"
                          trigger={
                            <div className="relative h-full w-full cursor-pointer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.image.file_url ?? ""}
                                alt={
                                  item.caption ||
                                  item.image.original_name ||
                                  "Gallery image"
                                }
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                              />

                              <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/45" />

                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <div className="flex h-12 w-12 scale-95 items-center justify-center rounded-full bg-white/15 opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:scale-100 group-hover:opacity-100">
                                  <Eye className="h-5 w-5 text-white" />
                                </div>
                              </div>
                            </div>
                          }
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="pointer-events-none absolute right-3 top-3 z-10 flex gap-2 opacity-100 transition-all duration-200 sm:opacity-0 sm:group-hover:opacity-100">
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="pointer-events-auto h-8 w-8 rounded-full bg-background/90 shadow-sm backdrop-blur"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFormMode({ type: "edit", entity: item });
                          setImageDialogOpen(true);
                        }}
                        disabled={blocked}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="pointer-events-auto h-8 w-8 rounded-full shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({ type: "image", entity: item });
                        }}
                        disabled={blocked}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              <div className="font-semibold">Gallery Groups</div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                className={[
                  "w-full rounded-xl border px-3 py-3 text-left transition cursor-pointer",
                  selectedGroupId === "all"
                    ? "border-primary bg-primary/10"
                    : "hover:border-primary/20 hover:bg-muted/40",
                ].join(" ")}
                onClick={() => setSelectedGroupId("all")}
              >
                <div className="font-medium">All</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {images.length} image(s)
                </div>
              </button>

              {groups.map((group) => {
                const active = selectedGroupId === group.id;
                const count = images.filter(
                  (img) => img.gallery_group_id === group.id
                ).length;

                return (
                  <div
                    key={group.id}
                    className={[
                      "rounded-xl border px-3 py-3 transition",
                      active
                        ? "border-primary bg-primary/10"
                        : "hover:border-primary/20 hover:bg-muted/40",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        className="flex-1 text-left cursor-pointer"
                        onClick={() => setSelectedGroupId(group.id)}
                      >
                        <div className="font-medium">{group.name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {count} image(s)
                        </div>
                      </button>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          disabled={blocked}
                          onClick={() => {
                            setGroupFormMode({ type: "edit", entity: group });
                            setGroupDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8"
                          disabled={blocked}
                          onClick={() =>
                            setDeleteTarget({ type: "group", entity: group })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {groups.length === 0 ? (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  No groups yet.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </PageShell>

      <Dialog
        open={groupDialogOpen}
        onOpenChange={(open) => {
          setGroupDialogOpen(open);
          if (!open) setGroupFormMode({ type: "create" });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {groupFormMode.type === "edit"
                ? "Edit Gallery Group"
                : "Add Gallery Group"}
            </DialogTitle>
          </DialogHeader>

          <FormWizard
            schema={galleryGroupSchema}
            defaultValues={getGroupDefaultValues(currentGroupEntity)}
            resetKey={groupResetKey}
            blocked={blocked}
            submitLoading={
              createGroupMutation.isPending || updateGroupMutation.isPending
            }
            submitLabel={groupFormMode.type === "edit" ? "Update" : "Create"}
            disableSubmitUntilDirty={groupFormMode.type === "edit"}
            onSubmit={async (values) => {
              if (groupFormMode.type === "edit") {
                await updateGroupMutation.mutateAsync({
                  id: groupFormMode.entity.id,
                  values,
                });
                return;
              }

              await createGroupMutation.mutateAsync(values);
            }}
            render={(methods) => (
              <InputField
                label="Group Name"
                required
                {...methods.register("name")}
                error={methods.formState.errors.name as any}
              />
            )}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={imageDialogOpen}
        onOpenChange={(open) => {
          setImageDialogOpen(open);
          if (!open) setImageFormMode({ type: "create" });
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Gallery Image</DialogTitle>
          </DialogHeader>

          <FormWizard
            schema={galleryImageSchema}
            defaultValues={getImageDefaultValues(currentImageEntity)}
            resetKey={imageResetKey}
            blocked={blocked}
            submitLoading={updateImageMutation.isPending}
            submitLabel="Update"
            disableSubmitUntilDirty
            onSubmit={async (values) => {
              if (imageFormMode.type !== "edit") return;

              await updateImageMutation.mutateAsync({
                id: imageFormMode.entity.id,
                values,
              });
            }}
            render={(methods) => (
              <div className="space-y-4">
                {currentImageEntity?.image ? (
                  <GalleryViewer
                    file={normalizeImage(currentImageEntity.image)}
                    thumbSize={96}
                    title={
                      currentImageEntity.caption?.trim() ||
                      currentImageEntity.image.original_name ||
                      "Gallery image"
                    }
                  />
                ) : null}

                <TextareaField
                  label="Caption"
                  rows={4}
                  placeholder="Write image caption..."
                  {...methods.register("caption")}
                  error={methods.formState.errors.caption as any}
                />

                <SelectField
                  control={methods.control}
                  name="gallery_group_id"
                  label="Gallery Group"
                  placeholder="Select group"
                  options={groupOptions}
                  required
                  disabled={blocked}
                />
              </div>
            )}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={uploadDialogOpen}
        onOpenChange={(open) => {
          setUploadDialogOpen(open);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Upload Gallery Images</DialogTitle>
            <DialogDescription>
              Select images and assign them to a gallery group.
            </DialogDescription>
          </DialogHeader>

          <FormWizard
            schema={galleryUploadSchema}
            defaultValues={getUploadDefaultValues(
              selectedGroupId === "all" ? groups[0]?.id : selectedGroupId
            )}
            resetKey={uploadResetKey}
            blocked={blocked}
            submitLoading={uploadQueueCount > 0}
            submitLabel="Save Images"
            onSubmit={async (values) => {
              if (!values.images?.length) {
                toast.error("Please select at least one image");
                return;
              }

              setUploadDialogOpen(false);

              values.images.forEach((img) => {
                setUploadQueueCount((prev) => prev + 1);

                uploadQueue.enqueue(async () => {
                  try {
                    await createImageMutation.mutateAsync({
                      image_id: img.image_id,
                      caption: img.caption?.trim() || "",
                      gallery_group_id: values.gallery_group_id,
                    });

                    toast.success("Image added to gallery");
                  } catch (error: any) {
                    toast.error(getErrorMessage(error, "Upload failed"));
                  } finally {
                    setUploadQueueCount((prev) => Math.max(0, prev - 1));
                  }
                });
              });
            }}
            render={(methods) => (
              <div className="space-y-5">
                <SelectField
                  control={methods.control}
                  name="gallery_group_id"
                  label="Gallery Group"
                  placeholder="Select group"
                  options={groupOptions}
                  required
                  disabled={blocked}
                />

                <GalleryPickerField
                  control={methods.control}
                  name="images"
                  label="Gallery Images"
                  disabled={blocked}
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
        loading={deleteGroupMutation.isPending || deleteImageMutation.isPending}
        title={
          deleteTarget?.type === "group"
            ? "Delete this gallery group?"
            : "Delete this gallery image?"
        }
        description="This action can’t be undone."
        onConfirm={async () => {
          if (!deleteTarget) return;

          if (deleteTarget.type === "group") {
            await deleteGroupMutation.mutateAsync(deleteTarget.entity.id);
            return;
          }

          await deleteImageMutation.mutateAsync(deleteTarget.entity.id);
        }}
      />
    </>
  );
}
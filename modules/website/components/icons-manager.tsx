"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  GripVertical,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { api } from "@/api";
import type { PaginatedResponse } from "@/types/api";
import { PageShell } from "@/components/layout/PageShell";
import { DataToolbar } from "@/components/data-table/DataToolbar";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/fields/InputField";
import { ImagePickerField } from "@/components/form/ImagePickerField";
import { Button } from "@/components/ui/button";
import { handleFormError } from "@/lib/handleFormError";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { iconSchema, type IconValues } from "../schema/icons.schema";

type UploadedImageEntity = {
  id: string;
  file_url: string;
  download_url?: string;
  file_type?: string;
  original_name?: string;
  size_bytes?: number;
  is_temporary?: boolean;
  meta?: any;
  uploaded_at?: string;
};

type IconEntity = {
  id: string;
  serial?: number;
  name: string;
  image?: UploadedImageEntity | null;
  sort_order?: number;
  school_id?: string;
  created_at?: string;
  created_by_id?: string;
  updated_at?: string;
  updated_by_id?: string;
};

const ICONS_URL = "/api/v1/icons/";
const ICON_DETAIL_URL = (id: string) => `/api/v1/icons/${id}/`;
const ICON_REORDER_URL = "/api/v1/icons/reorder/";

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

function getDefaultValues(entity?: IconEntity | null): IconValues {
  return {
    name: entity?.name ?? "",
    image_id: entity?.image?.id ?? "",
  };
}

function toPayload(values: IconValues) {
  return {
    name: values.name.trim(),
    image_id: values.image_id,
  };
}

type FormMode =
  | { type: "create" }
  | { type: "edit"; item: IconEntity };

function IconFormDialog(props: {
  open: boolean;
  mode: FormMode;
  entity: IconEntity | null;
  blocked: boolean;
  loading: boolean;
  uploading: boolean;
  resetKey: string;
  onOpenChange: (open: boolean) => void;
  onUploadStatusChange: (busy: boolean) => void;
  onSubmit: (values: IconValues, methods: any) => Promise<void>;
}) {
  const isEdit = props.mode.type === "edit";
  const defaultValues = React.useMemo(
    () => getDefaultValues(isEdit ? props.entity : null),
    [isEdit, props.entity]
  );

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Update Icon" : "Add Icon"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the selected icon."
              : "Create a new icon item."}
          </DialogDescription>
        </DialogHeader>

        <FormWizard
          schema={iconSchema}
          defaultValues={defaultValues}
          resetKey={props.resetKey}
          blocked={props.blocked}
          externallyBlocked={props.uploading}
          submitLabel={isEdit ? "Update" : "Create"}
          submitLoading={props.loading}
          disableSubmitUntilDirty={isEdit}
          onSubmit={props.onSubmit}
          render={(methods) => {
            const imageInitialUri =
              isEdit ? props.entity?.image?.file_url ?? null : null;

            return (
              <div className="grid gap-6 md:grid-cols-[1fr_320px]">
                <div className="space-y-4">
                  <InputField
                    label="Name"
                    required
                    placeholder="e.g. Facebook"
                    disabled={props.blocked}
                    {...methods.register("name")}
                    error={methods.formState.errors.name as any}
                  />
                </div>

                <Controller
                  control={methods.control}
                  name="image_id"
                  render={({ field, fieldState }) => (
                    <ImagePickerField
                      title="Icon Image"
                      required
                      value={field.value}
                      initialUri={imageInitialUri}
                      onChange={(value) => field.onChange(value || "")}
                      error={fieldState.error}
                      onUploadStatusChange={props.onUploadStatusChange}
                    />
                  )}
                />
              </div>
            );
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function SortableIconCard(props: {
  item: IconEntity;
  blocked: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={[
          "group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all",
          props.isEditing
            ? "border-primary/40 ring-2 ring-primary/10"
            : "hover:border-primary/20 hover:shadow-md",
          isDragging ? "opacity-70 shadow-lg" : "",
        ].join(" ")}
      >
        <div className="relative">
          <button
            type="button"
            className="absolute left-3 top-3 z-10 rounded-xl border bg-background/90 p-2 text-muted-foreground backdrop-blur"
            disabled={props.blocked}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div className="aspect-square overflow-hidden bg-muted">
            {props.item.image?.file_url ? (
              <img
                src={props.item.image.file_url}
                alt={props.item.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold">
              {props.item.name}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Sort: {props.item.sort_order ?? "-"}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={props.isEditing ? "secondary" : "outline"}
              disabled={props.blocked}
              onClick={props.onEdit}
              className="flex-1 rounded-xl"
            >
              <Pencil className="mr-2 h-4 w-4" />
              {props.isEditing ? "Editing" : "Edit"}
            </Button>

            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={props.blocked}
              onClick={props.onDelete}
              className="rounded-xl"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function IconsManager() {
  const qc = useQueryClient();

  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<IconEntity | null>(null);
  const [formMode, setFormMode] = React.useState<FormMode>({ type: "create" });
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const iconsQuery = useQuery({
    queryKey: ["icons", "list"],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<IconEntity>>(ICONS_URL, {
        params: {
          page: 1,
          page_size: 200,
        },
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  const detailQuery = useQuery({
    queryKey: [
      "icons",
      "detail",
      formMode.type === "edit" ? formMode.item.id : null,
    ],
    enabled: dialogOpen && formMode.type === "edit",
    queryFn: async () => {
      const id = formMode.type === "edit" ? formMode.item.id : "";
      const res = await api.get<IconEntity>(ICON_DETAIL_URL(id));
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: IconValues) => {
      const res = await api.post(ICONS_URL, toPayload(values));
      return res.data;
    },
    onSuccess: async () => {
      toast.success("Icon created");
      await qc.invalidateQueries({ queryKey: ["icons", "list"] });
      setDialogOpen(false);
      setFormMode({ type: "create" });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to create icon"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: IconValues;
    }) => {
      const res = await api.put(ICON_DETAIL_URL(id), toPayload(values));
      return res.data;
    },
    onSuccess: async () => {
      toast.success("Icon updated");
      await qc.invalidateQueries({ queryKey: ["icons", "list"] });
      setDialogOpen(false);
      setFormMode({ type: "create" });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to update icon"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(ICON_DETAIL_URL(id));
    },
    onSuccess: async (_, deletedId) => {
      toast.success("Icon deleted");
      await qc.invalidateQueries({ queryKey: ["icons", "list"] });
      setDeleteTarget(null);

      setFormMode((prev) =>
        prev.type === "edit" && prev.item.id === deletedId
          ? { type: "create" }
          : prev
      );
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to delete icon"));
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (payload: { ordered_ids: string[] }) => {
      const res = await api.post(ICON_REORDER_URL, payload);
      return res.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["icons", "list"] });
    },
    onError: async (error: any) => {
      toast.error(getErrorMessage(error, "Failed to reorder icons"));
      await qc.invalidateQueries({ queryKey: ["icons", "list"] });
    },
  });

  const blocked =
    iconsQuery.isFetching ||
    detailQuery.isFetching ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    reorderMutation.isPending ||
    uploading;

  const items = React.useMemo(() => {
    const rows = iconsQuery.data?.results ?? [];
    const q = debouncedQuery.trim().toLowerCase();

    if (!q) return rows;

    return rows.filter((item) => item.name.toLowerCase().includes(q));
  }, [iconsQuery.data?.results, debouncedQuery]);

  const currentEditEntity =
    formMode.type === "edit" ? detailQuery.data ?? formMode.item : null;

  const resetKey =
    formMode.type === "edit"
      ? `edit-${formMode.item.id}-${currentEditEntity?.updated_at ?? "loading"}`
      : "create-icon";

  const handleOpenCreate = () => {
    setFormMode({ type: "create" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: IconEntity) => {
    setFormMode({ type: "edit", item });
    setDialogOpen(true);
  };

  const handleSubmit = async (values: IconValues, methods: any) => {
    try {
      if (formMode.type === "edit") {
        await updateMutation.mutateAsync({
          id: formMode.item.id,
          values,
        });
        return;
      }

      await createMutation.mutateAsync(values);
      methods.reset(getDefaultValues(null));
    } catch (error) {
      handleFormError(error, { setError: methods.setError });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(items, oldIndex, newIndex);

    qc.setQueryData(["icons", "list"], (old: any) => {
      if (!old?.results) return old;

      const reordered = next.map((item, index) => ({
        ...item,
        sort_order: index + 1,
      }));

      return {
        ...old,
        results: reordered,
      };
    });

    reorderMutation.mutate({
      ordered_ids: next.map((item) => item.id),
    });
  };

  return (
    <>
      <PageShell
        title="Icons"
        description="Manage icons with card view, modal form and drag & drop ordering."
        actions={
          <Button onClick={handleOpenCreate} disabled={blocked}>
            <Plus className="mr-2 h-4 w-4" />
            Add Icon
          </Button>
        }
      >
        <div className="mb-5">
          <DataToolbar
            loading={iconsQuery.isFetching}
            disabled={blocked}
            search={{
              value: query,
              onChange: setQuery,
              placeholder: "Search icons",
              enabled: true,
              disabled: false,
            }}
            refresh={{
              onClick: () => {
                qc.invalidateQueries({ queryKey: ["icons", "list"] });
              },
              disabled: blocked,
              icon: <RefreshCw className="h-4 w-4" />,
              title: "Refresh",
            }}
          />
        </div>

        {iconsQuery.isError ? (
          <div className="rounded-2xl border bg-card p-6 text-sm">
            Failed to load icons.
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center">
            <div className="text-sm font-medium">No icons found</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Try changing the search or create a new icon.
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => (
                  <SortableIconCard
                    key={item.id}
                    item={item}
                    blocked={blocked}
                    isEditing={
                      formMode.type === "edit" && formMode.item.id === item.id
                    }
                    onEdit={() => handleOpenEdit(item)}
                    onDelete={() => setDeleteTarget(item)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </PageShell>

      <IconFormDialog
        open={dialogOpen}
        mode={formMode}
        entity={currentEditEntity}
        blocked={blocked}
        loading={createMutation.isPending || updateMutation.isPending}
        uploading={uploading}
        resetKey={resetKey}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setFormMode({ type: "create" });
          }
        }}
        onUploadStatusChange={setUploading}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        loading={deleteMutation.isPending}
        title="Delete this icon?"
        description="This action can’t be undone."
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
        }}
      />
    </>
  );
}
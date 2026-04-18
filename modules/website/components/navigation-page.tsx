"use client";

import * as React from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  GripVertical,
  ListTree,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Waypoints,
} from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { DataToolbar } from "@/components/data-table/DataToolbar";
import { SortableList } from "@/components/dnd/SortableList";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/fields/InputField";
import { Button } from "@/components/ui/button";

import type { NavigationEntity } from "../types/navigation.types";
import {
  createNavigation,
  deleteNavigation,
  fetchNavigations,
  reorderNavigations,
  updateNavigation,
} from "../api/navigation.api";
import {
  navigationFormSchema,
  normalizeNavigationValues,
  slugifyNavigationName,
  type NavigationFormValues,
} from "../schema/navigation.schema";
import {
  filterNavigations,
  formatSortOrder,
} from "../columns/navigation.columns";

type FormMode =
  | { type: "create" }
  | { type: "edit"; item: NavigationEntity };

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

function Chip(props: {
  children: React.ReactNode;
  mono?: boolean;
  active?: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs",
        props.mono ? "font-mono" : "",
        props.active
          ? "border-primary/20 bg-primary/10 text-foreground"
          : "border-border bg-background text-muted-foreground",
      ].join(" ")}
    >
      {props.children}
    </span>
  );
}

function NavigationFormCard(props: {
  mode: FormMode;
  blocked: boolean;
  loading: boolean;
  resetKey: string;
  onSubmit: (values: NavigationFormValues, methods: any) => Promise<void>;
  onCancelEdit: () => void;
}) {
  const isEdit = props.mode.type === "edit";

  const defaultValues: NavigationFormValues =
    props.mode.type === "edit"
      ? {
          name: props.mode.item.name,
          slug: props.mode.item.slug,
        }
      : {
          name: "",
          slug: "",
        };

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      <div className="border-b px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                {isEdit ? (
                  <Pencil className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </div>
              <div className="text-base font-semibold">
                {isEdit ? "Update Navigation" : "Add Navigation"}
              </div>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              {isEdit
                ? "Edit the selected navigation item using the same form."
                : "Create new navigation items. They can be reordered by drag and drop."}
            </p>
          </div>

          {isEdit ? <Chip active>Editing</Chip> : null}
        </div>
      </div>

      <div className="p-5">
        <FormWizard
          schema={navigationFormSchema}
          defaultValues={defaultValues}
          resetKey={props.resetKey}
          blocked={props.blocked}
          disableSubmitUntilDirty={isEdit}
          submitLabel={isEdit ? "Update" : "Create"}
          submitLoading={props.loading}
          onCancel={isEdit ? props.onCancelEdit : undefined}
          onSubmit={props.onSubmit}
          className="space-y-0"
          render={(methods) => {
            const watchedName = methods.watch("name");
            const watchedSlug = methods.watch("slug");

            return (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <InputField
                    label="Name"
                    required
                    placeholder="e.g. Student Management"
                    disabled={props.blocked}
                    {...methods.register("name", {
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        const nextName = e.target.value;
                        const currentSlug = methods.getValues("slug");

                        methods.setValue("name", nextName, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });

                        if (!isEdit && !currentSlug.trim()) {
                          methods.setValue(
                            "slug",
                            slugifyNavigationName(nextName),
                            {
                              shouldDirty: true,
                              shouldValidate: true,
                            }
                          );
                        }
                      },
                    })}
                    error={methods.formState.errors.name as any}
                  />

                  <InputField
                    label="Slug"
                    required
                    placeholder="e.g. student-management"
                    disabled={props.blocked}
                    {...methods.register("slug")}
                    error={methods.formState.errors.slug as any}
                  />
                </div>

                <div className="hidden flex-wrap items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Preview</span>
                  <Chip>{watchedName?.trim() || "Untitled"}</Chip>
                  <Chip mono>{watchedSlug?.trim() || "slug-preview"}</Chip>
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

function NavigationRow(props: {
  item: NavigationEntity;
  blocked: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={[
        "group rounded-2xl border bg-card shadow-sm transition-all",
        props.isEditing
          ? "border-primary/40 ring-2 ring-primary/10"
          : "hover:border-primary/20 hover:shadow-md",
      ].join(" ")}
    >
      <div className="flex items-center gap-4 px-4 py-4">
        <div className="rounded-xl border bg-background p-2 text-primary">
          <ListTree className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-base font-semibold">
              {props.item.name}
            </span>
            <Chip mono>{props.item.slug}</Chip>
            {props.isEditing ? <Chip active>Editing now</Chip> : null}
          </div>

          <div className="mt-1 text-sm text-muted-foreground">
            {formatSortOrder(props.item.sort_order)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={props.isEditing ? "secondary" : "outline"}
            disabled={props.blocked}
            onClick={props.onEdit}
            className="rounded-xl"
          >
            <Pencil className="mr-2 h-4 w-4" />
            {props.isEditing ? "Editing" : "Edit"}
          </Button>

          <Button
            size="sm"
            variant="destructive"
            disabled={props.blocked}
            onClick={props.onDelete}
            className="rounded-xl"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

export function NavigationPage() {
  const qc = useQueryClient();
  const formRef = React.useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [deleteTarget, setDeleteTarget] =
    React.useState<NavigationEntity | null>(null);
  const [formMode, setFormMode] = React.useState<FormMode>({ type: "create" });

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const navigationsQuery = useQuery({
    queryKey: ["navigations", "list"],
    queryFn: fetchNavigations,
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: createNavigation,
    onSuccess: async () => {
      toast.success("Navigation created");
      await qc.invalidateQueries({ queryKey: ["navigations", "list"] });
      setFormMode({ type: "create" });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to create navigation"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: NavigationFormValues }) =>
      updateNavigation(id, payload),
    onSuccess: async () => {
      toast.success("Navigation updated");
      await qc.invalidateQueries({ queryKey: ["navigations", "list"] });
      setFormMode({ type: "create" });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to update navigation"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNavigation,
    onSuccess: async (_, deletedId) => {
      toast.success("Navigation deleted");
      await qc.invalidateQueries({ queryKey: ["navigations", "list"] });
      setDeleteTarget(null);

      setFormMode((prev) =>
        prev.type === "edit" && prev.item.id === deletedId
          ? { type: "create" }
          : prev
      );
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to delete navigation"));
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderNavigations,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["navigations", "list"] });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to reorder navigations"));
      qc.invalidateQueries({ queryKey: ["navigations", "list"] });
    },
  });

  const blocked =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    reorderMutation.isPending;

  const loading = navigationsQuery.isFetching;

  const items = React.useMemo(
    () => filterNavigations(navigationsQuery.data?.results ?? [], debouncedQuery),
    [navigationsQuery.data?.results, debouncedQuery]
  );

  const handleSubmit = async (values: NavigationFormValues, methods: any) => {
    const payload = normalizeNavigationValues(values);

    if (formMode.type === "edit") {
      await updateMutation.mutateAsync({
        id: formMode.item.id,
        payload,
      });
      return;
    }

    await createMutation.mutateAsync(payload);
    methods.reset({
      name: "",
      slug: "",
    });
  };

  const handleEdit = (item: NavigationEntity) => {
    setFormMode({ type: "edit", item });

    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const handleCancelEdit = () => {
    setFormMode({ type: "create" });
  };

  return (
    <>
      <PageShell
        title="Navigations"
        description="Manage application navigations with create, edit, delete and drag & drop ordering."
      >
        <div className="mb-5">
          <DataToolbar
            loading={loading}
            disabled={blocked}
            search={{
              value: query,
              onChange: setQuery,
              placeholder: "Search navigations",
              enabled: true,
              disabled: false,
            }}
            refresh={{
              onClick: () => {
                qc.invalidateQueries({ queryKey: ["navigations", "list"] });
              },
              disabled: blocked,
              icon: <RefreshCw className="h-4 w-4" />,
              title: "Refresh",
            }}
          />
        </div>

        <div className="space-y-6">
          <div ref={formRef}>
            <NavigationFormCard
              mode={formMode}
              blocked={blocked}
              loading={createMutation.isPending || updateMutation.isPending}
              resetKey={
                formMode.type === "edit"
                  ? `edit-${formMode.item.id}-${formMode.item.updated_at}`
                  : "create-navigation"
              }
              onSubmit={handleSubmit}
              onCancelEdit={handleCancelEdit}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <Waypoints className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Navigation List</div>
                  <div className="text-xs text-muted-foreground">
                    Drag cards to reorder items.
                  </div>
                </div>
              </div>

              <Chip>{items.length} item{items.length === 1 ? "" : "s"}</Chip>
            </div>

            {navigationsQuery.isError ? (
              <div className="rounded-2xl border bg-card p-6 text-sm">
                Failed to load navigations.
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border bg-card p-10 text-center">
                <div className="text-sm font-medium">No navigations found</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Try changing the search or create a new navigation item.
                </div>
              </div>
            ) : (
              <SortableList<NavigationEntity>
                items={items}
                disabled={blocked}
                itemClassName="bg-transparent"
                onReorder={(next) => {
                  qc.setQueryData(["navigations", "list"], (old: any) => {
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
                }}
                renderItem={(item) => (
                  <NavigationRow
                    item={item}
                    blocked={blocked}
                    isEditing={
                      formMode.type === "edit" && formMode.item.id === item.id
                    }
                    onEdit={() => handleEdit(item)}
                    onDelete={() => setDeleteTarget(item)}
                  />
                )}
              />
            )}
          </div>
        </div>
      </PageShell>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        loading={deleteMutation.isPending}
        title="Delete this navigation?"
        description="This action can't be undone."
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
        }}
      />
    </>
  );
}
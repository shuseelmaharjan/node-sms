"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { JSONContent } from "@tiptap/react";

import { api } from "@/api";
import type { PaginatedResponse } from "@/types/api";
import { PageShell } from "@/components/layout/PageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { AddActionButton } from "@/components/data-table/AddActionButton";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/fields/InputField";
import { RichTextEditor } from "@/components/fields/RichTextEditor";
import { handleFormError } from "@/lib/handleFormError";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  eventsColumns,
  type EventEntity,
} from "../columns/events.columns";
import {
  eventSchema,
  type EventValues,
} from "../schema/events.schema";

const URL = "/api/v1/events/";
const DETAIL = (id: string) => `/api/v1/events/${id}/`;

function createEmpty(): JSONContent {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

function parse(value?: string | null): JSONContent {
  if (!value) return createEmpty();
  try {
    return JSON.parse(value);
  } catch {
    return createEmpty();
  }
}

function toPayload(v: EventValues) {
  return {
    title: v.title.trim(),
    description: JSON.stringify(v.description ?? createEmpty()),
    event_date: v.event_date,
  };
}

function getDefault(entity?: EventEntity | null): EventValues {
  return {
    title: entity?.title ?? "",
    description: parse(entity?.description),
    event_date: entity?.event_date ?? "",
  };
}

export function EventsManager() {
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [selectedId, setSelectedId] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<EventEntity | null>(null);

  const [q, setQ] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const ordering = sorting.map((s) => (s.desc ? `-${s.id}` : s.id)).join(",");

  const listQuery = useQuery({
    queryKey: ["events", pageIndex, pageSize, q, ordering],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<EventEntity>>(URL, {
        params: {
          page: pageIndex + 1,
          page_size: pageSize,
          search: q,
          ordering,
        },
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  const detailQuery = useQuery({
    queryKey: ["event", selectedId],
    enabled: dialogOpen && mode === "edit",
    queryFn: async () => {
      const res = await api.get<EventEntity>(DETAIL(selectedId));
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (v: EventValues) =>
      api.post(URL, toPayload(v)),
    onSuccess: () => {
      toast.success("Created");
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (v: EventValues) =>
      api.put(DETAIL(selectedId), toPayload(v)),
    onSuccess: () => {
      toast.success("Updated");
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(DETAIL(id)),
    onSuccess: () => {
      toast.success("Deleted");
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const rows = listQuery.data?.results ?? [];
  const current = detailQuery.data ?? null;

  const defaultValues = React.useMemo(
    () => (mode === "edit" ? getDefault(current) : getDefault()),
    [mode, current]
  );

  const columns = React.useMemo(
    () =>
      eventsColumns({
        onEdit: (row) => {
          setMode("edit");
          setSelectedId(row.id);
          setDialogOpen(true);
        },
        onDelete: (row) => setDeleteTarget(row),
      }),
    []
  );

  return (
    <>
      <PageShell title="Events" description="Manage events">
        <DataTable
          data={rows}
          columns={columns}
          loading={listQuery.isLoading}
          sorting={sorting}
          onSortingChange={setSorting}
          pagination={{
            pageIndex,
            pageSize,
            pageCount: Math.ceil((listQuery.data?.count ?? 0) / pageSize),
            totalCount: listQuery.data?.count ?? 0,
            onPageChange: setPageIndex,
            onPageSizeChange: setPageSize,
          }}
          toolbar={{
            search: {
              value: q,
              onChange: setQ,
              enabled: true,
              placeholder: "Search events",
            },
            actions: (
              <AddActionButton
                add={{
                  kind: "modal",
                  label: "Add Event",
                  onClick: () => {
                    setMode("create");
                    setDialogOpen(true);
                  },
                }}
              />
            ),
          }}
          refresh={{
            onClick: () => {
              setQ("");
              setSorting([]);
              setPageIndex(0);
            },
            icon: <RefreshCw className="h-4 w-4" />,
          }}
        />
      </PageShell>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Add" : "Edit"} Event
            </DialogTitle>
          </DialogHeader>

          <FormWizard
            schema={eventSchema}
            defaultValues={defaultValues}
            onSubmit={async (v, m) => {
              try {
                if (mode === "create") await createMutation.mutateAsync(v);
                else await updateMutation.mutateAsync(v);
              } catch (e) {
                handleFormError(e, { setError: m.setError });
              }
            }}
            render={(methods) => (
              <div className="space-y-6">
                <InputField
                  label="Title"
                  {...methods.register("title")}
                />

                <Controller
                  control={methods.control}
                  name="description"
                  render={({ field }) => (
                    <RichTextEditor
                      label="Description"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />

                <InputField
                  label="Event Date"
                  type="datetime-local"
                  {...methods.register("event_date")}
                />
              </div>
            )}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
        }}
      />
    </>
  );
}
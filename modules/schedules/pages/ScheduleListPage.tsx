"use client";

import * as React from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/api";
import { PageShell } from "@/components/layout/PageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { AddActionButton, type AddAction } from "@/components/data-table/AddActionButton";
import { ConfirmDeleteDialog } from "@/components/crud/ConfirmDeleteDialog";

import type { Schedule } from "../types/schedule.types";
import { scheduleColumns } from "../columns/schedule.columns";
import { ScheduleFormModal } from "../components/schedule-form-modal";

import { useBatches, useClasses, useSections } from "../hooks/schedule.hooks";
import { Button } from "@/components/ui/button";
import { SchedulePdfSheet } from "../components/schedule-pdf-sheet";

const LIST_URL = "/api/v1/academics/schedules/";
const DETAIL_URL = (id: string) => `/api/v1/academics/schedules/${id}/`;

function clampPage(n: number) {
  return Math.max(0, n);
}

export function ScheduleListPage() {
  const qc = useQueryClient();

  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(20);

  const [search, setSearch] = React.useState("");
  const [ordering, setOrdering] = React.useState<string>("day_of_week");

  const [batch, setBatch] = React.useState<string>("");
  const [academicClass, setAcademicClass] = React.useState<string>("");
  const [section, setSection] = React.useState<string>("");
  const [dayOfWeek, setDayOfWeek] = React.useState<string>("");
  const [kind, setKind] = React.useState<string>("");

  const [open, setOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Schedule | null>(null);
  const [pdfOpen, setPdfOpen] = React.useState(false);


  const batchesQ = useBatches();
  const classesQ = useClasses(batch);
  const sectionsQ = useSections(academicClass);

  React.useEffect(() => {
    setAcademicClass("");
    setSection("");
  }, [batch]);

  React.useEffect(() => {
    setSection("");
  }, [academicClass]);

  const listQuery = useQuery({
    queryKey: ["schedules", "list", { pageIndex, pageSize, search, ordering, batch, academicClass, section, dayOfWeek, kind }],
    queryFn: async () => {
      const res = await api.get(LIST_URL, {
        params: {
          page: pageIndex + 1,
          page_size: pageSize,
          search: search || undefined,
          ordering: ordering || undefined,
          batch: batch || undefined,
          academic_class: academicClass || undefined,
          section: section || undefined,
          day_of_week: dayOfWeek || undefined,
          kind: kind || undefined,
        },
      });
      return res.data as { count: number; results: Schedule[]; meta?: any };
    },
    placeholderData: keepPreviousData,
  });

  React.useEffect(() => {
    setPageIndex(0);
  }, [search, ordering, batch, academicClass, section, dayOfWeek, kind]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(DETAIL_URL(id));
    },
    onSuccess: async () => {
      toast.success("Deleted");
      await qc.invalidateQueries({ queryKey: ["schedules", "list"] });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Failed to delete schedule"),
  });

  const blocked = listQuery.isFetching || deleteMutation.isPending;

  const pageData = listQuery.data;
  const rows = pageData?.results ?? [];
  const totalCount = pageData?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  const meta = (pageData as any)?.meta ?? {
    searchable: ["title", "class", "subject", "teacher"],
    search_param: "search",
  };

  const columns = React.useMemo(
    () =>
      scheduleColumns({
        onEdit: (row) => {
          setEditId(row.id);
          setOpen(true);
        },
        onDelete: (row) => setDeleteTarget(row),
      }),
    []
  );

  const addAction: AddAction = {
    kind: "modal",
    label: "Add Schedule",
    onClick: () => {
      setEditId(null);
      setOpen(true);
    },
  };

  return (
    <>
      <PageShell
        title="Schedules"
        description="Create, edit and manage class schedules."
        actions={
          <div className="flex gap-2">
            <Button variant="default" onClick={() => setPdfOpen(true)}>
              <FileText className="mr-2 h-4 w-4" />
              Generate
            </Button>
          </div>
        }
      >
        <DataTable<Schedule>
          data={rows}
          columns={columns}
          loading={listQuery.isLoading}
          emptyText={listQuery.isError ? "Failed to load." : "No schedules found."}
          meta={meta}
          toolbar={{
            search: {
              value: search,
              onChange: setSearch,
              enabled: true,
              placeholder: "Search schedules",
            },
            filters: {
              // kind: {
              //   value: kind,
              //   onChange: (v) => setKind(v === "__all__" ? "" : v),
              //   options: [
              //     { value: "__all__", label: "All types" },
              //     { value: "class", label: "Class" },
              //     { value: "break", label: "Break" },
              //     { value: "holiday", label: "Holiday" },
              //   ],
              //   placeholder: "Type",
              //   label: "Type",
              // },
              batch: {
                value: batch,
                onChange: (v) => setBatch(v === "__all__" ? "" : v),
                options: [
                  { value: "__all__", label: "All batches" },
                  ...(batchesQ.data?.results ?? []).map((b) => ({
                    value: String(b.id),
                    label: b.name,
                  })),
                ],
                placeholder: "Batch",
                label: "Batch",
              },
              academic_class: {
                value: academicClass,
                onChange: (v) => setAcademicClass(v === "__all__" ? "" : v),
                options: [
                  { value: "__all__", label: "All classes" },
                  ...(classesQ.data?.results ?? []).map((c) => ({
                    value: c.id,
                    label: c.name,
                  })),
                ],
                placeholder: "Class",
                label: "Class",
              },
              // section: {
              //   value: section,
              //   onChange: (v) => setSection(v === "__all__" ? "" : v),
              //   options: [
              //     { value: "__all__", label: "All sections" },
              //     ...(sectionsQ.data?.results ?? []).map((s) => ({
              //       value: s.id,
              //       label: s.name,
              //     })),
              //   ],
              //   placeholder: "Section",
              //   label: "Section",
              // },
              day_of_week: {
                value: dayOfWeek,
                onChange: (v) => setDayOfWeek(v === "__all__" ? "" : v),
                options: [
                  { value: "__all__", label: "All days" },
                  { value: "0", label: "Sunday" },
                  { value: "1", label: "Monday" },
                  { value: "2", label: "Tuesday" },
                  { value: "3", label: "Wednesday" },
                  { value: "4", label: "Thursday" },
                  { value: "5", label: "Friday" },
                  { value: "6", label: "Saturday" },
                ],
                placeholder: "Day",
                label: "Day",
              },
            },
            actions: <AddActionButton add={addAction} />,
          }}
          refresh={{
            onClick: () => qc.invalidateQueries({ queryKey: ["schedules", "list"] }),
            disabled: blocked,
            icon: <RefreshCcw className="h-4 w-4" />,
            title: "Refresh list",
          }}
          pagination={{
            pageIndex,
            pageSize,
            pageCount,
            totalCount,
            currentPage: (pageData as any)?.meta?.page ?? pageIndex + 1,
            onPageChange: (n) => setPageIndex(clampPage(n)),
            onPageSizeChange: (n) => {
              setPageSize(n);
              setPageIndex(0);
            },
          }}
          sorting={[]}
          onSortingChange={() => { }}
        />
      </PageShell>

      {/* Controlled modal (BatchFormModal pattern) */}
      <ScheduleFormModal
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditId(null);
        }}
        editId={editId}
      />

      {/* Delete confirm */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        loading={deleteMutation.isPending}
        title="Delete this schedule?"
        description="This action can't be undone."
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
        }}
      />

      {/* PDF Generator Sheet */}
      <SchedulePdfSheet
        open={pdfOpen}
        onOpenChange={(v) => {
          setPdfOpen(v);
        }}
      />
    </>
  );
}

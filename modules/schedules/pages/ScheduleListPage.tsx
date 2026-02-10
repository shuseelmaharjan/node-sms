"use client";

import * as React from "react";
import { RefreshCcw } from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { ScheduleUpsertDialog } from "../components/ScheduleUpsertDialog";
import { scheduleColumns, ScheduleRowActionsInline } from "../columns/schedule.columns";
import { useSchedules, useBatches, useClasses, useSections } from "../hooks/schedule.hooks";
import type { Schedule } from "../types/schedule.types";

function clampPage(n: number) {
  return Math.max(0, n);
}

export function ScheduleListPage() {
  // table state
  const [pageIndex, setPageIndex] = React.useState(0); // 0-based UI
  const [pageSize, setPageSize] = React.useState(20);

  const [search, setSearch] = React.useState("");
  const [ordering, setOrdering] = React.useState<string>("day_of_week");

  // filters
  const [batch, setBatch] = React.useState<string>("");
  const [academicClass, setAcademicClass] = React.useState<string>("");
  const [section, setSection] = React.useState<string>("");
  const [dayOfWeek, setDayOfWeek] = React.useState<string>("");

  // lookups for filters
  const batchesQ = useBatches();
  const classesQ = useClasses(batch);
  const sectionsQ = useSections({ batch, academic_class: academicClass });

  const params = React.useMemo(() => {
    return {
      page: pageIndex + 1,          // DRF
      page_size: pageSize,

      search: search || undefined,
      ordering: ordering || undefined,

      batch: batch || undefined,
      academic_class: academicClass || undefined,
      section: section || undefined,
      day_of_week: dayOfWeek || undefined,
    };
  }, [pageIndex, pageSize, search, ordering, batch, academicClass, section, dayOfWeek]);

  const q = useSchedules(params);

  const rows: Schedule[] = (q.data?.results ?? []).map((s) => s);

  const totalCount = q.data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  // reset dependent filters
  React.useEffect(() => {
    setAcademicClass("");
    setSection("");
  }, [batch]);

  React.useEffect(() => {
    setSection("");
  }, [academicClass]);

  const columns = React.useMemo(() => {
    // Replace actions col with inline actions (clean + reliable)
    const cols = scheduleColumns().filter((c) => c.id !== "actions");
    cols.push({
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }: any) => <ScheduleRowActionsInline schedule={row.original} />,
    } as any);
    return cols;
  }, []);

  return (
    <PageShell
      title="Schedules"
      description="Create, edit and manage class schedules."
      actions={<ScheduleUpsertDialog />}
    >
      <DataTable<Schedule>
        data={rows}
        columns={columns}
        loading={q.isLoading}
        emptyText="No schedules found."
        meta={{
          searchable: ["class", "subject", "teacher"],
          search_param: "search",
          filterable: {},
          sortable: {},
        }}
        toolbar={{
          search: {
            value: search,
            onChange: (v) => {
              setSearch(v);
              setPageIndex(0);
            },
            placeholder: "Search class / subject / teacher...",
          },
          filters: {
            batch: {
              value: batch,
              onChange: (v) => {
                setBatch(v === "__all__" ? "" : v);
                setPageIndex(0);
              },
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
              onChange: (v) => {
                setAcademicClass(v === "__all__" ? "" : v);
                setPageIndex(0);
              },
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
            section: {
              value: section,
              onChange: (v) => {
                setSection(v === "__all__" ? "" : v);
                setPageIndex(0);
              },
              options: [
                { value: "__all__", label: "All sections" },
                ...(sectionsQ.data?.results ?? []).map((s) => ({
                  value: s.id,
                  label: s.name,
                })),
              ],
              placeholder: "Section",
              label: "Section",
            },
            day_of_week: {
              value: dayOfWeek,
              onChange: (v) => {
                setDayOfWeek(v === "__all__" ? "" : v);
                setPageIndex(0);
              },
              options: [
                { value: "__all__", label: "All days" },
                { value: "0", label: "Monday" },
                { value: "1", label: "Tuesday" },
                { value: "2", label: "Wednesday" },
                { value: "3", label: "Thursday" },
                { value: "4", label: "Friday" },
                { value: "5", label: "Saturday" },
                { value: "6", label: "Sunday" },
              ],
              placeholder: "Day",
              label: "Day",
            },
          },
        }}
        refresh={{
          onClick: () => q.refetch(),
          disabled: q.isFetching,
          icon: <RefreshCcw className={q.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />,
          title: "Refresh",
        }}
        pagination={{
          pageIndex,
          pageSize,
          pageCount,
          totalCount,
          currentPage: pageIndex + 1,
          onPageChange: (next) => setPageIndex(clampPage(next)),
          onPageSizeChange: (s) => {
            setPageSize(s);
            setPageIndex(0);
          },
        }}
        sorting={[]}
        onSortingChange={() => {}}
      />
    </PageShell>
  );
}

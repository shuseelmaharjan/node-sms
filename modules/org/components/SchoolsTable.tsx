"use client";

import { useRef, useState, useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { UseFormReturn } from "react-hook-form";
import { schoolsApi, schoolsKeys } from "../api/schools.api";
import type { School } from "../types/schools.types";
import type { SchoolFormValues } from "../schemas/schools.schema";
import { handleFormError } from "@/lib/handleFormError";
import { DataTable } from "@/components/data-table/data-table";
import { CrudDialog } from "@/components/crud/crud-dialog";
import { CrudToolbar } from "@/components/crud/crud-toolbar";
import { createSchoolColumns } from "../columns/school-columns";
import { SchoolForm } from "./SchoolForm";

export function SchoolsTable() {
  const qc = useQueryClient();
  const formRef = useRef<any>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  const { data: schools = [], isLoading, isError } = useQuery({
    queryKey: schoolsKeys.list(),
    queryFn: schoolsApi.list,
  });

  const filteredSchools = useMemo(() => {
    if (!searchQuery.trim()) return schools;
    const query = searchQuery.toLowerCase();
    return schools.filter(
      (school) =>
        school.name.toLowerCase().includes(query) ||
        school.code.toLowerCase().includes(query) ||
        school.email.toLowerCase().includes(query)
    );
  }, [searchQuery, schools]);

  const invalidateQueries = useCallback(
    () => qc.invalidateQueries({ queryKey: schoolsKeys.list() }),
    [qc]
  );

  const createMutation = useMutation({
    mutationFn: schoolsApi.create,
    onSuccess: async () => {
      toast.success("School created successfully");
      await invalidateQueries();
      setDialogOpen(false);
    },
    onError: (err) => {
      handleFormError<SchoolFormValues>(err, {
        setError: formRef.current?.setError,
        toast: (msg) => toast.error(msg),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SchoolFormValues }) =>
      schoolsApi.update(id, payload),
    onSuccess: async () => {
      toast.success("School updated successfully");
      await invalidateQueries();
      setDialogOpen(false);
    },
    onError: (err) => {
      handleFormError<SchoolFormValues>(err, {
        setError: formRef.current?.setError,
        toast: (msg) => toast.error(msg),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: schoolsApi.remove,
    onSuccess: async () => {
      toast.success("School deleted successfully");
      await invalidateQueries();
    },
    onError: () => toast.error("Failed to delete school"),
  });

  const handleCreate = useCallback(() => {
    setMode("create");
    setSelectedSchool(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((school: School) => {
    setMode("edit");
    setSelectedSchool(school);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    (school: School) => {
      if (window.confirm(`Delete school "${school.name}"?`)) {
        deleteMutation.mutate(school.id);
      }
    },
    [deleteMutation]
  );

  const columns = useMemo(
    () => createSchoolColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    [handleEdit, handleDelete]
  );

  const handleSubmit = async () => {
    const form = formRef.current;
    if (!form) return;

    const isValid = await form.trigger();
    if (!isValid) return;

    const values = form.getValues();

    if (mode === "create") {
      createMutation.mutate(values);
    } else if (mode === "edit" && selectedSchool) {
      updateMutation.mutate({ id: selectedSchool.id, payload: values });
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading schools…</p>;
  }

  if (isError) {
    return <p className="text-sm text-destructive">Failed to load schools.</p>;
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <CrudToolbar
        search={searchQuery}
        onSearch={setSearchQuery}
        onCreate={handleCreate}
        createLabel="Add School"
      />
      <DataTable data={filteredSchools} columns={columns} />

      <CrudDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={mode === "create" ? "Create School" : "Edit School"}
        submitLabel={mode === "create" ? "Create" : "Update"}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      >
        <SchoolForm initial={selectedSchool} onFormReady={(form) => (formRef.current = form)} />
      </CrudDialog>
    </div>
  );
}

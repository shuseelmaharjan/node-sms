"use client";

import { useRef, useState, useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { UseFormReturn } from "react-hook-form";
import { campusesApi, campusesKeys } from "../api/campuses.api";
import type { Campus } from "../types/campuses.types";
import type { CampusFormValues } from "../schemas/campuses.schema";
import { handleFormError } from "@/lib/handleFormError";
import { DataTable } from "@/components/data-table/data-table";
import { CrudDialog } from "@/components/crud/crud-dialog";
import { CrudToolbar } from "@/components/crud/crud-toolbar";
import { createCampusColumns } from "../columns/campus-columns";
import { CampusForm } from "./CampusForm";

export function CampusesTable() {
  const qc = useQueryClient();
  const formRef = useRef<UseFormReturn<CampusFormValues> | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null);

  const { data: campuses = [], isLoading, isError } = useQuery({
    queryKey: campusesKeys.list(),
    queryFn: campusesApi.list,
  });

  const filteredCampuses = useMemo(() => {
    if (!searchQuery.trim()) return campuses;
    const query = searchQuery.toLowerCase();
    return campuses.filter(
      (campus) =>
        campus.name.toLowerCase().includes(query) || campus.address.toLowerCase().includes(query)
    );
  }, [searchQuery, campuses]);

  const invalidateQueries = useCallback(
    () => qc.invalidateQueries({ queryKey: campusesKeys.list() }),
    [qc]
  );

  const createMutation = useMutation({
    mutationFn: campusesApi.create,
    onSuccess: async () => {
      toast.success("Campus created successfully");
      await invalidateQueries();
      setDialogOpen(false);
    },
    onError: (err) => {
      handleFormError<CampusFormValues>(err, {
        setError: formRef.current?.setError,
        toast: (msg) => toast.error(msg),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CampusFormValues }) =>
      campusesApi.update(id, payload),
    onSuccess: async () => {
      toast.success("Campus updated successfully");
      await invalidateQueries();
      setDialogOpen(false);
    },
    onError: (err) => {
      handleFormError<CampusFormValues>(err, {
        setError: formRef.current?.setError,
        toast: (msg) => toast.error(msg),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: campusesApi.remove,
    onSuccess: async () => {
      toast.success("Campus deleted successfully");
      await invalidateQueries();
    },
    onError: () => toast.error("Failed to delete campus"),
  });

  const handleCreate = useCallback(() => {
    setMode("create");
    setSelectedCampus(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((campus: Campus) => {
    setMode("edit");
    setSelectedCampus(campus);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    (campus: Campus) => {
      if (window.confirm(`Delete campus "${campus.name}"?`)) {
        deleteMutation.mutate(campus.id);
      }
    },
    [deleteMutation]
  );

  const columns = useMemo(
    () => createCampusColumns({ onEdit: handleEdit, onDelete: handleDelete }),
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
    } else if (mode === "edit" && selectedCampus) {
      updateMutation.mutate({ id: selectedCampus.id, payload: values });
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading campuses…</p>;
  }

  if (isError) {
    return <p className="text-sm text-destructive">Failed to load campuses.</p>;
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <CrudToolbar
        search={searchQuery}
        onSearch={setSearchQuery}
        onCreate={handleCreate}
        createLabel="Add Campus"
      />
      <DataTable data={filteredCampuses} columns={columns} />

      <CrudDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={mode === "create" ? "Create Campus" : "Edit Campus"}
        submitLabel={mode === "create" ? "Create" : "Update"}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      >
        <CampusForm initial={selectedCampus} onFormReady={(form) => (formRef.current = form)} />
      </CrudDialog>
    </div>
  );
}

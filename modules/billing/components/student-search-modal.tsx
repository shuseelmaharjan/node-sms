"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ExternalLink,
  Search,
  UserRoundSearch,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

import { billingApi } from "../api/billing.api";
import type { StudentSearchResult } from "../types/billing.types";

type SearchMode = "name" | "scope";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function StudentSearchModal({
  open,
  onOpenChange,
}: Props) {
  const router = useRouter();

  const [mode, setMode] =
    React.useState<SearchMode>("name");

  const [search, setSearch] =
    React.useState("");

  const [batchId, setBatchId] =
    React.useState("");

  const [classId, setClassId] =
    React.useState("");

  const [sectionId, setSectionId] =
    React.useState("all");

  const [results, setResults] =
    React.useState<StudentSearchResult[]>([]);

  const [searched, setSearched] =
    React.useState(false);

  const [isSearching, setIsSearching] =
    React.useState(false);

  const batchesQuery = useQuery({
    queryKey: [
      "billing",
      "student-search",
      "batches",
    ],
    queryFn: billingApi.listBatches,
    enabled: open && mode === "scope",
  });

  const classesQuery = useQuery({
    queryKey: [
      "billing",
      "student-search",
      "classes",
      batchId,
    ],
    queryFn: () =>
      billingApi.listClasses(
        Number(batchId)
      ),
    enabled:
      open &&
      mode === "scope" &&
      Boolean(batchId),
  });

  const sectionsQuery = useQuery({
    queryKey: [
      "billing",
      "student-search",
      "sections",
      classId,
    ],
    queryFn: () =>
      billingApi.listSections(classId),
    enabled:
      open &&
      mode === "scope" &&
      Boolean(classId),
  });

  React.useEffect(() => {
    setClassId("");
    setSectionId("all");
    setResults([]);
    setSearched(false);
  }, [batchId]);

  React.useEffect(() => {
    setSectionId("all");
    setResults([]);
    setSearched(false);
  }, [classId]);

  React.useEffect(() => {
    setResults([]);
    setSearched(false);
    setIsSearching(false);

    if (mode === "name") {
      setBatchId("");
      setClassId("");
      setSectionId("all");
    } else {
      setSearch("");
    }
  }, [mode]);

  React.useEffect(() => {
    if (!open) {
      setMode("name");
      setSearch("");
      setBatchId("");
      setClassId("");
      setSectionId("all");
      setResults([]);
      setSearched(false);
      setIsSearching(false);
    }
  }, [open]);

  async function handleSearch() {
    if (isSearching) {
      return;
    }

    if (mode === "name") {
      const normalizedSearch =
        search.trim();

      if (normalizedSearch.length < 2) {
        toast.error(
          "Enter at least 2 characters of the student's name, username, registration number, phone or email."
        );
        return;
      }

      setIsSearching(true);

      try {
        const found =
          await billingApi.searchStudents({
            mode: "name",
            search: normalizedSearch,
          });

        setResults(found);
        setSearched(true);

        if (found.length === 1) {
          openStudent(found[0]);
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Student search failed."
        );
      } finally {
        setIsSearching(false);
      }

      return;
    }

    if (!batchId) {
      toast.error("Select a batch.");
      return;
    }

    if (!classId) {
      toast.error("Select a class.");
      return;
    }

    setIsSearching(true);

    try {
      const found =
        await billingApi.searchStudents({
          mode: "scope",
          batchId: Number(batchId),
          academicClassId: classId,
          sectionId:
            sectionId === "all"
              ? undefined
              : sectionId,
        });

      setResults(found);
      setSearched(true);

      if (found.length === 1) {
        openStudent(found[0]);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Student search failed."
      );
    } finally {
      setIsSearching(false);
    }
  }

  function openStudent(
    student: StudentSearchResult
  ) {
    onOpenChange(false);

    router.push(
      `/students/${student.id}`
    );
  }

  const resultDescription =
    mode === "name"
      ? "No active student matched the entered search."
      : "No actively enrolled student matched the selected batch, class and section.";

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSearching) {
          return;
        }

        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Find student account
          </DialogTitle>

          <DialogDescription>
            Search directly by student identity or browse students by academic scope.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
          <Button
            type="button"
            variant={
              mode === "name"
                ? "secondary"
                : "ghost"
            }
            className="justify-center"
            disabled={isSearching}
            onClick={() =>
              setMode("name")
            }
          >
            <Search className="mr-2 h-4 w-4" />
            Name or username
          </Button>

          <Button
            type="button"
            variant={
              mode === "scope"
                ? "secondary"
                : "ghost"
            }
            className="justify-center"
            disabled={isSearching}
            onClick={() =>
              setMode("scope")
            }
          >
            <UsersRound className="mr-2 h-4 w-4" />
            Batch and class
          </Button>
        </div>

        {mode === "name" ? (
          <div className="space-y-2 py-2">
            <Label htmlFor="billing-student-search">
              Name, username or student identity
            </Label>

            <Input
              id="billing-student-search"
              value={search}
              disabled={isSearching}
              onChange={(event) => {
                setSearch(event.target.value);
                setResults([]);
                setSearched(false);
              }}
              placeholder="Name, username, registration number, phone or email"
              autoComplete="off"
              autoFocus
              onKeyDown={(event) => {
                if (
                  event.key === "Enter"
                ) {
                  event.preventDefault();
                  void handleSearch();
                }
              }}
            />

            <p className="text-xs text-muted-foreground">
              Enter at least 2 characters. Batch and class are not required in this mode.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Batch *
              </Label>

              <Select
                value={batchId}
                onValueChange={setBatchId}
                disabled={
                  isSearching ||
                  batchesQuery.isLoading
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      batchesQuery.isLoading
                        ? "Loading batches…"
                        : "Select batch"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {(batchesQuery.data ?? []).map(
                    (batch) => (
                      <SelectItem
                        key={batch.id}
                        value={String(
                          batch.id
                        )}
                      >
                        {batch.name}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Class *
              </Label>

              <Select
                value={classId}
                onValueChange={setClassId}
                disabled={
                  isSearching ||
                  !batchId ||
                  classesQuery.isLoading
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !batchId
                        ? "Select batch first"
                        : classesQuery.isLoading
                          ? "Loading classes…"
                          : "Select class"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {(classesQuery.data ?? []).map(
                    (classroom) => (
                      <SelectItem
                        key={classroom.id}
                        value={classroom.id}
                      >
                        {classroom.name}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>
                Section (optional)
              </Label>

              <Select
                value={sectionId}
                onValueChange={setSectionId}
                disabled={
                  isSearching ||
                  !classId ||
                  sectionsQuery.isLoading
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !classId
                        ? "Select class first"
                        : sectionsQuery.isLoading
                          ? "Loading sections…"
                          : "All sections"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    All sections and students without a section
                  </SelectItem>

                  {(sectionsQuery.data ?? []).map(
                    (section) => (
                      <SelectItem
                        key={section.id}
                        value={section.id}
                      >
                        {section.name}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground sm:col-span-2">
              Student name is not required in this mode. Selecting a batch and class will list all active students in that scope.
            </p>
          </div>
        )}

        {searched ? (
          <div className="overflow-hidden rounded-xl border">
            {results.length > 0 ? (
              <div className="max-h-[320px] overflow-y-auto">
                <div className="divide-y">
                  {results.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between gap-4 p-4 transition hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">
                          {student.full_name || "Student"}
                        </div>

                        <div className="truncate text-sm text-muted-foreground">
                          @{student.username || "no-username"}

                          {student.current_enrollment?.batch_name
                            ? ` · ${student.current_enrollment.batch_name}`
                            : ""}

                          {student.current_enrollment?.class_name
                            ? ` · ${student.current_enrollment.class_name}`
                            : ""}

                          {student.current_enrollment?.section_name
                            ? ` / ${student.current_enrollment.section_name}`
                            : ""}
                        </div>

                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {student.registration_no ? (
                            <span>
                              Reg: {student.registration_no}
                            </span>
                          ) : null}

                          {student.phone ? (
                            <span>
                              Phone: {student.phone}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        title={`Open ${student.full_name || "student"} account`}
                        aria-label={`Open ${student.full_name || "student"} account`}
                        onClick={() => openStudent(student)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {resultDescription}
              </div>
            )}
          </div>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSearching}
            onClick={() =>
              onOpenChange(false)
            }
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={isSearching}
            onClick={() =>
              void handleSearch()
            }
          >
            {isSearching ? (
              <Spinner className="mr-2" />
            ) : mode === "name" ? (
              <Search className="mr-2 h-4 w-4" />
            ) : (
              <UsersRound className="mr-2 h-4 w-4" />
            )}

            {isSearching
              ? "Searching…"
              : mode === "name"
                ? "Search student"
                : "List students"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
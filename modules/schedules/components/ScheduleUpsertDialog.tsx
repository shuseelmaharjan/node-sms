"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Save } from "lucide-react";

import type { Schedule, ScheduleCreatePayload } from "../types/schedule.types";
import { useBatches, useClasses, useSections, useSubjects, useTeachers, useCreateSchedule, useUpdateSchedule } from "../hooks/schedule.hooks";

const DAYS = [
  { value: "0", label: "Monday" },
  { value: "1", label: "Tuesday" },
  { value: "2", label: "Wednesday" },
  { value: "3", label: "Thursday" },
  { value: "4", label: "Friday" },
  { value: "5", label: "Saturday" },
  { value: "6", label: "Sunday" },
];

function hhmm(v?: string) {
  if (!v) return "";
  return v.slice(0, 5); // "HH:MM"
}

export function ScheduleUpsertDialog({
  trigger,
  initial,
}: {
  trigger?: React.ReactNode;
  initial?: Schedule | null; // if provided => edit
}) {
  const isEdit = Boolean(initial?.id);
  const [open, setOpen] = React.useState(false);

  // form state
  const [batchId, setBatchId] = React.useState<string>("");
  const [classId, setClassId] = React.useState<string>("");
  const [sectionId, setSectionId] = React.useState<string>("__none__");
  const [subjectId, setSubjectId] = React.useState<string>("");
  const [teacherId, setTeacherId] = React.useState<string>("");
  const [day, setDay] = React.useState<string>("0");
  const [startTime, setStartTime] = React.useState<string>("");
  const [endTime, setEndTime] = React.useState<string>("");

  const [teacherSearch, setTeacherSearch] = React.useState("");

  // lookups
  const batchesQ = useBatches();
  const classesQ = useClasses(batchId);
  const sectionsQ = useSections({ batch: batchId, academic_class: classId });
  const subjectsQ = useSubjects();
  const teachersQ = useTeachers(teacherSearch);

  const createM = useCreateSchedule();
  const updateM = useUpdateSchedule();

  // hydrate on open for edit
  React.useEffect(() => {
    if (!open) return;

    if (initial) {
      setBatchId(String(initial.batch_id));
      setClassId(initial.academic_class_id);
      setSectionId(initial.section_id ?? "__none__");
      setSubjectId(initial.subject_id);
      setTeacherId(initial.teacher_id);
      setDay(String(initial.day_of_week));
      setStartTime(hhmm(initial.start_time));
      setEndTime(hhmm(initial.end_time));
    } else {
      setBatchId("");
      setClassId("");
      setSectionId("__none__");
      setSubjectId("");
      setTeacherId("");
      setDay("0");
      setStartTime("");
      setEndTime("");
    }
  }, [open, initial]);

  // when batch changes, clear dependent fields
  React.useEffect(() => {
    if (!open) return;
    setClassId("");
    setSectionId("__none__");
  }, [batchId]);

  // when class changes, clear section
  React.useEffect(() => {
    if (!open) return;
    setSectionId("__none__");
  }, [classId]);

  const saving = createM.isPending || updateM.isPending;

  const onSubmit = async () => {
    const payload: ScheduleCreatePayload = {
      batch_id: Number(batchId),
      academic_class_id: classId,
      section_id: sectionId === "__none__" ? null : sectionId,
      subject_id: subjectId,
      teacher_id: teacherId,
      day_of_week: Number(day),
      start_time: startTime,
      end_time: endTime,
    };

    if (isEdit && initial) {
      await updateM.mutateAsync({ id: initial.id, payload });
    } else {
      await createM.mutateAsync(payload);
    }

    setOpen(false);
  };

  const canSubmit =
    batchId &&
    classId &&
    subjectId &&
    teacherId &&
    startTime &&
    endTime &&
    !saving;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add schedule
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Schedule" : "Create Schedule"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Batch */}
          <div className="grid gap-2">
            <Label>Batch</Label>
            <Select value={batchId} onValueChange={setBatchId}>
              <SelectTrigger>
                <SelectValue placeholder={batchesQ.isLoading ? "Loading..." : "Select batch"} />
              </SelectTrigger>
              <SelectContent>
                {(batchesQ.data?.results ?? []).map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name} {b.is_active ? "" : "(inactive)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Class */}
          <div className="grid gap-2">
            <Label>Class</Label>
            <Select value={classId} onValueChange={setClassId} disabled={!batchId}>
              <SelectTrigger>
                <SelectValue placeholder={!batchId ? "Select batch first" : classesQ.isLoading ? "Loading..." : "Select class"} />
              </SelectTrigger>
              <SelectContent>
                {(classesQ.data?.results ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} {c.is_active ? "" : "(inactive)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Section */}
          <div className="grid gap-2">
            <Label>Section (optional)</Label>
            <Select value={sectionId} onValueChange={setSectionId} disabled={!classId}>
              <SelectTrigger>
                <SelectValue placeholder={!classId ? "Select class first" : sectionsQ.isLoading ? "Loading..." : "Select section"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No section</SelectItem>
                {(sectionsQ.data?.results ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} {s.is_active ? "" : "(inactive)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="grid gap-2">
            <Label>Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder={subjectsQ.isLoading ? "Loading..." : "Select subject"} />
              </SelectTrigger>
              <SelectContent>
                {(subjectsQ.data?.results ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Teacher */}
          <div className="grid gap-2">
            <Label>Teacher</Label>
            <Input
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              placeholder="Search teacher name / phone / email..."
            />
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder={teachersQ.isLoading ? "Loading..." : "Select teacher"} />
              </SelectTrigger>
              <SelectContent>
                {(teachersQ.data?.results ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.full_name} {t.phone ? `• ${t.phone}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Day + times */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Day</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger>
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Start</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label>End</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={!canSubmit}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isEdit ? "Save changes" : "Create"}
            </Button>
          </div>

          {(createM.error || updateM.error) ? (
            <div className="text-sm text-destructive">
              Failed. Check conflicts (teacher/class overlap) or invalid inputs.
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

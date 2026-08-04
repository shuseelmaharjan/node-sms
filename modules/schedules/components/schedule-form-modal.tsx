"use client";

import * as React from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { api } from "@/api";
import { handleFormError } from "@/lib/handleFormError";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormWizard } from "@/components/form/FormWizard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  Schedule,
  ScheduleCreatePayload,
  ScheduleKind,
} from "../types/schedule.types";
import {
  scheduleSchema,
  type ScheduleValues,
} from "../schema/schedule.schema";

import {
  useBatches,
  useClasses,
  useSections,
  useSubjects,
  useTeachers,
} from "../hooks/schedule.hooks";

const LIST_URL = "/api/v1/academics/schedules/";

const DETAIL_URL = (id: string) =>
  `/api/v1/academics/schedules/${id}/`;

const NONE_SECTION = "__none__";
const NONE_SUBJECT = "__none_subject__";
const NONE_TEACHER = "__none_teacher__";
const WHOLE_BATCH = "__batch__";

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const KINDS: Array<{
  value: ScheduleKind;
  label: string;
}> = [
  {
    value: "class",
    label: "Class",
  },
  {
    value: "break",
    label: "Break",
  },
  {
    value: "holiday",
    label: "Holiday",
  },
];

function hhmm(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 5);
}

function inferKind(
  entity: Schedule
): ScheduleKind {
  if (entity.kind) {
    return entity.kind;
  }

  if (
    entity.subject_id ||
    entity.teacher_id
  ) {
    return "class";
  }

  return "break";
}

function toDefaults(
  entity: Schedule
): ScheduleValues {
  const kind = inferKind(entity);

  return {
    kind,

    title: (
      entity.title ??
      entity.subject_name ??
      ""
    ).trim(),

    batch_id: entity.batch_id
      ? String(entity.batch_id)
      : "",

    academic_class_id:
      entity.academic_class_id ??
      (kind === "class"
        ? ""
        : WHOLE_BATCH),

    section_id:
      entity.section_id ??
      NONE_SECTION,

    subject_id:
      entity.subject_id ?? "",

    teacher_id:
      entity.teacher_id ?? "",

    day_of_week:
      typeof entity.day_of_week ===
      "number"
        ? entity.day_of_week
        : 0,

    start_time: hhmm(
      entity.start_time
    ),

    end_time: hhmm(
      entity.end_time
    ),
  };
}

const createDefaults: ScheduleValues = {
  kind: "class",
  title: "",
  batch_id: "",
  academic_class_id: "",
  section_id: NONE_SECTION,
  subject_id: "",
  teacher_id: "",
  day_of_week: 0,
  start_time: "",
  end_time: "",
};

function toPayload(
  values: ScheduleValues
): ScheduleCreatePayload {
  const wholeBatch =
    values.academic_class_id ===
    WHOLE_BATCH;

  return {
    batch_id: Number(
      values.batch_id
    ),

    kind: values.kind,

    title: values.title.trim(),

    academic_class_id: wholeBatch
      ? null
      : values.academic_class_id ||
        null,

    section_id:
      wholeBatch ||
      values.section_id ===
        NONE_SECTION
        ? null
        : values.section_id,

    subject_id:
      values.kind === "class"
        ? values.subject_id
        : null,

    teacher_id:
      values.kind === "class"
        ? values.teacher_id
        : null,

    day_of_week:
      values.day_of_week,

    start_time:
      values.start_time,

    end_time:
      values.end_time,
  };
}

type ScheduleFormModalProps = {
  open: boolean;
  onOpenChange: (
    value: boolean
  ) => void;
  editId: string | null;
};

export function ScheduleFormModal({
  open,
  onOpenChange,
  editId,
}: ScheduleFormModalProps) {
  const queryClient =
    useQueryClient();

  const isEdit =
    Boolean(editId);

  const detailQuery =
    useQuery({
      queryKey: [
        "schedules",
        "detail",
        editId ?? null,
      ],

      enabled:
        open &&
        isEdit &&
        Boolean(editId),

      queryFn: async () => {
        const response =
          await api.get<Schedule>(
            DETAIL_URL(editId!)
          );

        return response.data;
      },
    });

  const createMutation =
    useMutation({
      mutationFn: async (
        values: ScheduleValues
      ) => {
        const response =
          await api.post(
            LIST_URL,
            toPayload(values)
          );

        return response.data;
      },

      onSuccess: async () => {
        toast.success(
          "Schedule created successfully."
        );

        await queryClient.invalidateQueries(
          {
            queryKey: [
              "schedules",
              "list",
            ],
          }
        );

        onOpenChange(false);
      },
    });

  const updateMutation =
    useMutation({
      mutationFn: async (
        values: ScheduleValues
      ) => {
        const response =
          await api.patch(
            DETAIL_URL(editId!),
            toPayload(values)
          );

        return response.data;
      },

      onSuccess: async () => {
        toast.success(
          "Schedule updated successfully."
        );

        await Promise.all([
          queryClient.invalidateQueries(
            {
              queryKey: [
                "schedules",
                "list",
              ],
            }
          ),

          queryClient.invalidateQueries(
            {
              queryKey: [
                "schedules",
                "detail",
                editId,
              ],
            }
          ),
        ]);

        onOpenChange(false);
      },
    });

  const blocked =
    detailQuery.isFetching ||
    createMutation.isPending ||
    updateMutation.isPending;

  const entity =
    detailQuery.data ?? null;

  const defaultValues =
    React.useMemo<ScheduleValues>(
      () => {
        if (
          isEdit &&
          entity
        ) {
          return toDefaults(
            entity
          );
        }

        return createDefaults;
      },
      [
        isEdit,
        entity,
      ]
    );

  const resetKey =
    React.useMemo(() => {
      if (!open) {
        return "closed";
      }

      if (!isEdit) {
        return "create-open";
      }

      return entity
        ? `edit-${editId}-ready`
        : `edit-${editId}-loading`;
    }, [
      open,
      isEdit,
      entity,
      editId,
    ]);

  return (
    <Dialog
      open={open}
      onOpenChange={(
        nextOpen
      ) => {
        if (!blocked) {
          onOpenChange(
            nextOpen
          );
        }
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? "Update Schedule"
              : "Add Schedule"}
          </DialogTitle>
        </DialogHeader>

        <FormWizard
          schema={scheduleSchema}
          defaultValues={
            defaultValues
          }
          resetKey={resetKey}
          blocked={blocked}
          submitLoading={
            createMutation.isPending ||
            updateMutation.isPending
          }
          submitLabel={
            isEdit
              ? "Update"
              : "Create"
          }
          disableSubmitUntilDirty={
            isEdit
          }
          onCancel={() =>
            onOpenChange(false)
          }
          onSubmit={async (
            values,
            methods
          ) => {
            try {
              const valid =
                await methods.trigger();

              if (!valid) {
                toast.error(
                  "Please complete all required fields."
                );

                return;
              }

              if (isEdit) {
                await updateMutation.mutateAsync(
                  values
                );
              } else {
                await createMutation.mutateAsync(
                  values
                );
              }
            } catch (error) {
              handleFormError(
                error,
                {
                  setError:
                    methods.setError,
                }
              );
            }
          }}
          render={(methods) => {
            const kind =
              methods.watch(
                "kind"
              ) as ScheduleKind;

            const title =
              methods.watch(
                "title"
              ) ?? "";

            const batchId =
              methods.watch(
                "batch_id"
              ) ?? "";

            const classId =
              methods.watch(
                "academic_class_id"
              ) ?? "";

            const sectionId =
              methods.watch(
                "section_id"
              ) ?? NONE_SECTION;

            const subjectId =
              methods.watch(
                "subject_id"
              ) ?? "";

            const teacherId =
              methods.watch(
                "teacher_id"
              ) ?? "";

            const dayOfWeek =
              methods.watch(
                "day_of_week"
              );

            const startTime =
              methods.watch(
                "start_time"
              ) ?? "";

            const endTime =
              methods.watch(
                "end_time"
              ) ?? "";

            const classSelected =
              Boolean(classId) &&
              classId !==
                WHOLE_BATCH;

            const batchesQuery =
              useBatches();

            const classesQuery =
              useClasses(
                batchId
              );

            const sectionsQuery =
              useSections(
                classSelected
                  ? classId
                  : undefined
              );

            const subjectsQuery =
              useSubjects();

            const teachersQuery =
              useTeachers(
                subjectId,
                ""
              );

            const errors =
              methods.formState
                .errors;

            const previousBatchRef =
              React.useRef<
                string | null
              >(null);

            const previousClassRef =
              React.useRef<
                string | null
              >(null);

            const previousSubjectRef =
              React.useRef<
                string | null
              >(null);

            const previousKindRef =
              React.useRef<
                ScheduleKind | null
              >(null);

            /*
             * Reset dependent fields only
             * after the user actually
             * changes the batch.
             */
            React.useEffect(() => {
              if (
                previousBatchRef
                  .current === null
              ) {
                previousBatchRef.current =
                  batchId;

                return;
              }

              if (
                previousBatchRef
                  .current === batchId
              ) {
                return;
              }

              previousBatchRef.current =
                batchId;

              methods.setValue(
                "section_id",
                NONE_SECTION,
                {
                  shouldDirty: true,
                  shouldValidate: true,
                }
              );

              methods.setValue(
                "subject_id",
                "",
                {
                  shouldDirty: true,
                  shouldValidate: true,
                }
              );

              methods.setValue(
                "teacher_id",
                "",
                {
                  shouldDirty: true,
                  shouldValidate: true,
                }
              );

              methods.setValue(
                "academic_class_id",
                kind === "class"
                  ? ""
                  : WHOLE_BATCH,
                {
                  shouldDirty: true,
                  shouldValidate: true,
                }
              );

              // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [batchId]);

            /*
             * Reset section whenever the
             * selected class changes.
             */
            React.useEffect(() => {
              if (
                previousClassRef
                  .current === null
              ) {
                previousClassRef.current =
                  classId;

                return;
              }

              if (
                previousClassRef
                  .current === classId
              ) {
                return;
              }

              previousClassRef.current =
                classId;

              methods.setValue(
                "section_id",
                NONE_SECTION,
                {
                  shouldDirty: true,
                  shouldValidate: true,
                }
              );

              // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [classId]);

            /*
             * Reset teacher whenever the
             * selected subject changes.
             */
            React.useEffect(() => {
              if (
                previousSubjectRef
                  .current === null
              ) {
                previousSubjectRef.current =
                  subjectId;

                return;
              }

              if (
                previousSubjectRef
                  .current === subjectId
              ) {
                return;
              }

              previousSubjectRef.current =
                subjectId;

              methods.setValue(
                "teacher_id",
                "",
                {
                  shouldDirty: true,
                  shouldValidate: true,
                }
              );

              // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [subjectId]);

            /*
             * Class schedules require a
             * class, subject and teacher.
             *
             * Break/holiday schedules may
             * apply to the whole batch.
             */
            React.useEffect(() => {
              if (
                previousKindRef
                  .current === null
              ) {
                previousKindRef.current =
                  kind;

                return;
              }

              if (
                previousKindRef
                  .current === kind
              ) {
                return;
              }

              previousKindRef.current =
                kind;

              if (
                kind !== "class"
              ) {
                if (
                  !methods.getValues(
                    "academic_class_id"
                  )
                ) {
                  methods.setValue(
                    "academic_class_id",
                    WHOLE_BATCH,
                    {
                      shouldDirty: true,
                      shouldValidate:
                        true,
                    }
                  );
                }

                methods.setValue(
                  "section_id",
                  NONE_SECTION,
                  {
                    shouldDirty: true,
                    shouldValidate:
                      true,
                  }
                );

                methods.setValue(
                  "subject_id",
                  "",
                  {
                    shouldDirty: true,
                    shouldValidate:
                      true,
                  }
                );

                methods.setValue(
                  "teacher_id",
                  "",
                  {
                    shouldDirty: true,
                    shouldValidate:
                      true,
                  }
                );
              } else if (
                methods.getValues(
                  "academic_class_id"
                ) === WHOLE_BATCH
              ) {
                methods.setValue(
                  "academic_class_id",
                  "",
                  {
                    shouldDirty: true,
                    shouldValidate:
                      true,
                  }
                );
              }

              // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [kind]);

            return (
              <div className="space-y-6">
                {/* Type */}
                <FormFieldBlock
                  label="Type"
                  error={
                    errors.kind
                      ?.message
                  }
                >
                  <Select
                    value={kind}
                    onValueChange={(
                      value
                    ) => {
                      methods.setValue(
                        "kind",
                        value as ScheduleKind,
                        {
                          shouldDirty:
                            true,
                          shouldTouch:
                            true,
                          shouldValidate:
                            true,
                        }
                      );
                    }}
                    disabled={blocked}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>

                    <SelectContent>
                      {KINDS.map(
                        (
                          option
                        ) => (
                          <SelectItem
                            key={
                              option.value
                            }
                            value={
                              option.value
                            }
                          >
                            {
                              option.label
                            }
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </FormFieldBlock>

                {/* Title */}
                <FormFieldBlock
                  label="Title"
                  error={
                    errors.title
                      ?.message
                  }
                >
                  <Input
                    value={title}
                    onChange={(
                      event
                    ) => {
                      methods.setValue(
                        "title",
                        event.target
                          .value,
                        {
                          shouldDirty:
                            true,
                          shouldTouch:
                            true,
                          shouldValidate:
                            true,
                        }
                      );
                    }}
                    onBlur={() =>
                      methods.trigger(
                        "title"
                      )
                    }
                    disabled={blocked}
                    placeholder={
                      kind === "class"
                        ? "e.g. Mathematics"
                        : kind ===
                            "break"
                          ? "e.g. Lunch Break"
                          : "e.g. Weekly Off"
                    }
                  />
                </FormFieldBlock>

                {/* Batch */}
                <FormFieldBlock
                  label="Batch"
                  error={
                    errors.batch_id
                      ?.message
                  }
                >
                  <Select
                    value={batchId}
                    onValueChange={(
                      value
                    ) => {
                      methods.setValue(
                        "batch_id",
                        value,
                        {
                          shouldDirty:
                            true,
                          shouldTouch:
                            true,
                          shouldValidate:
                            true,
                        }
                      );
                    }}
                    disabled={
                      blocked ||
                      batchesQuery.isLoading
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          batchesQuery.isLoading
                            ? "Loading..."
                            : "Select batch"
                        }
                      />
                    </SelectTrigger>

                    <SelectContent>
                      {(
                        batchesQuery
                          .data
                          ?.results ??
                        []
                      ).map(
                        (batch) => (
                          <SelectItem
                            key={
                              batch.id
                            }
                            value={String(
                              batch.id
                            )}
                          >
                            {
                              batch.name
                            }
                            {!batch.is_active
                              ? " (inactive)"
                              : ""}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </FormFieldBlock>

                {/* Class */}
                <FormFieldBlock
                  label={
                    kind === "class"
                      ? "Class"
                      : "Class (optional)"
                  }
                  error={
                    errors
                      .academic_class_id
                      ?.message
                  }
                >
                  <Select
                    value={classId}
                    onValueChange={(
                      value
                    ) => {
                      methods.setValue(
                        "academic_class_id",
                        value,
                        {
                          shouldDirty:
                            true,
                          shouldTouch:
                            true,
                          shouldValidate:
                            true,
                        }
                      );
                    }}
                    disabled={
                      blocked ||
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
                              ? "Loading..."
                              : kind ===
                                  "class"
                                ? "Select class"
                                : "Select scope"
                        }
                      />
                    </SelectTrigger>

                    <SelectContent>
                      {kind !==
                      "class" ? (
                        <SelectItem
                          value={
                            WHOLE_BATCH
                          }
                        >
                          Whole batch
                        </SelectItem>
                      ) : null}

                      {(
                        classesQuery
                          .data
                          ?.results ??
                        []
                      ).map(
                        (
                          academicClass
                        ) => (
                          <SelectItem
                            key={
                              academicClass.id
                            }
                            value={
                              academicClass.id
                            }
                          >
                            {
                              academicClass.name
                            }
                            {!academicClass.is_active
                              ? " (inactive)"
                              : ""}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </FormFieldBlock>

                {/* Section */}
                <FormFieldBlock
                  label="Section (optional)"
                  error={
                    errors.section_id
                      ?.message
                  }
                >
                  <Select
                    value={
                      sectionId ||
                      NONE_SECTION
                    }
                    onValueChange={(
                      value
                    ) => {
                      methods.setValue(
                        "section_id",
                        value,
                        {
                          shouldDirty:
                            true,
                          shouldTouch:
                            true,
                          shouldValidate:
                            true,
                        }
                      );
                    }}
                    disabled={
                      blocked ||
                      !classSelected ||
                      sectionsQuery.isLoading
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          !classSelected
                            ? classId ===
                              WHOLE_BATCH
                              ? "Whole batch selected"
                              : "Select class first"
                            : sectionsQuery.isLoading
                              ? "Loading..."
                              : "Select section"
                        }
                      />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem
                        value={
                          NONE_SECTION
                        }
                      >
                        {kind ===
                        "class"
                          ? "No section"
                          : "All sections"}
                      </SelectItem>

                      {(
                        sectionsQuery
                          .data
                          ?.results ??
                        []
                      ).map(
                        (section) => (
                          <SelectItem
                            key={
                              section.id
                            }
                            value={
                              section.id
                            }
                          >
                            {
                              section.name
                            }
                            {!section.is_active
                              ? " (inactive)"
                              : ""}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </FormFieldBlock>

                {/* Subject and Teacher */}
                {kind ===
                "class" ? (
                  <>
                    <FormFieldBlock
                      label="Subject"
                      error={
                        errors
                          .subject_id
                          ?.message
                      }
                    >
                      <Select
                        value={
                          subjectId ||
                          NONE_SUBJECT
                        }
                        onValueChange={(
                          value
                        ) => {
                          methods.setValue(
                            "subject_id",
                            value ===
                              NONE_SUBJECT
                              ? ""
                              : value,
                            {
                              shouldDirty:
                                true,
                              shouldTouch:
                                true,
                              shouldValidate:
                                true,
                            }
                          );
                        }}
                        disabled={
                          blocked ||
                          subjectsQuery.isLoading
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              subjectsQuery.isLoading
                                ? "Loading..."
                                : "Select subject"
                            }
                          />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem
                            value={
                              NONE_SUBJECT
                            }
                          >
                            Select subject
                          </SelectItem>

                          {(
                            subjectsQuery
                              .data
                              ?.results ??
                            []
                          ).map(
                            (
                              subject
                            ) => (
                              <SelectItem
                                key={
                                  subject.id
                                }
                                value={
                                  subject.id
                                }
                              >
                                {
                                  subject.name
                                }{" "}
                                (
                                {
                                  subject.code
                                }
                                )
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </FormFieldBlock>

                    <FormFieldBlock
                      label="Teacher"
                      error={
                        errors
                          .teacher_id
                          ?.message
                      }
                    >
                      <Select
                        value={
                          teacherId ||
                          NONE_TEACHER
                        }
                        onValueChange={(
                          value
                        ) => {
                          methods.setValue(
                            "teacher_id",
                            value ===
                              NONE_TEACHER
                              ? ""
                              : value,
                            {
                              shouldDirty:
                                true,
                              shouldTouch:
                                true,
                              shouldValidate:
                                true,
                            }
                          );
                        }}
                        disabled={
                          blocked ||
                          !subjectId ||
                          teachersQuery.isLoading
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              !subjectId
                                ? "Select subject first"
                                : teachersQuery.isLoading
                                  ? "Loading..."
                                  : "Select teacher"
                            }
                          />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem
                            value={
                              NONE_TEACHER
                            }
                          >
                            Select teacher
                          </SelectItem>

                          {(
                            teachersQuery
                              .data
                              ?.results ??
                            []
                          ).map(
                            (
                              teacher
                            ) => (
                              <SelectItem
                                key={
                                  teacher.id
                                }
                                value={
                                  teacher.id
                                }
                              >
                                {
                                  teacher.full_name
                                }
                                {teacher
                                  .specialization
                                  ?.teacher_level
                                  ? ` • ${teacher.specialization.teacher_level}`
                                  : ""}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </FormFieldBlock>
                  </>
                ) : null}

                {/* Day and Time */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormFieldBlock
                    label="Day"
                    error={
                      errors
                        .day_of_week
                        ?.message
                    }
                  >
                    <Select
                      value={String(
                        dayOfWeek
                      )}
                      onValueChange={(
                        value
                      ) => {
                        methods.setValue(
                          "day_of_week",
                          Number(
                            value
                          ),
                          {
                            shouldDirty:
                              true,
                            shouldTouch:
                              true,
                            shouldValidate:
                              true,
                          }
                        );
                      }}
                      disabled={
                        blocked
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>

                      <SelectContent>
                        {DAYS.map(
                          (day) => (
                            <SelectItem
                              key={
                                day.value
                              }
                              value={String(
                                day.value
                              )}
                            >
                              {
                                day.label
                              }
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </FormFieldBlock>

                  <FormFieldBlock
                    label="Start"
                    error={
                      errors
                        .start_time
                        ?.message
                    }
                  >
                    <Input
                      type="time"
                      value={
                        startTime
                      }
                      onChange={(
                        event
                      ) => {
                        methods.setValue(
                          "start_time",
                          event.target
                            .value,
                          {
                            shouldDirty:
                              true,
                            shouldTouch:
                              true,
                            shouldValidate:
                              true,
                          }
                        );

                        void methods.trigger(
                          "end_time"
                        );
                      }}
                      onBlur={() => {
                        void methods.trigger(
                          [
                            "start_time",
                            "end_time",
                          ]
                        );
                      }}
                      disabled={
                        blocked
                      }
                    />
                  </FormFieldBlock>

                  <FormFieldBlock
                    label="End"
                    error={
                      errors
                        .end_time
                        ?.message
                    }
                  >
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(
                        event
                      ) => {
                        methods.setValue(
                          "end_time",
                          event.target
                            .value,
                          {
                            shouldDirty:
                              true,
                            shouldTouch:
                              true,
                            shouldValidate:
                              true,
                          }
                        );

                        void methods.trigger(
                          "start_time"
                        );
                      }}
                      onBlur={() => {
                        void methods.trigger(
                          [
                            "start_time",
                            "end_time",
                          ]
                        );
                      }}
                      disabled={
                        blocked
                      }
                    />
                  </FormFieldBlock>
                </div>

                {startTime &&
                endTime &&
                startTime >=
                  endTime ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive">
                    End time must
                    be later than
                    start time.
                  </div>
                ) : null}
              </div>
            );
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function FormFieldBlock({
  label,
  error,
  children,
}: {
  label: string;
  error?: unknown;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>

      {children}

      {error ? (
        <p className="text-xs font-medium leading-snug text-destructive">
          {String(error)}
        </p>
      ) : null}
    </div>
  );
}
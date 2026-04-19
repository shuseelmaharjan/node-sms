"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller } from "react-hook-form";
import { z } from "zod";
import type { JSONContent } from "@tiptap/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api } from "@/api";
import { PageShell } from "@/components/layout/PageShell";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/fields/InputField";
import { CheckboxField } from "@/components/fields/CheckboxField";
import { ImagePickerField } from "@/components/form/ImagePickerField";
import { RichTextEditor } from "@/components/fields/RichTextEditor";
import { TagsInputField } from "@/components/fields/TagsInputField";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/select";
import { handleFormError } from "@/lib/handleFormError";

import type { PaginatedResponse } from "@/types/api";
import type { CourseEntity, CourseFormEntity } from "../types/course.types";

type NavigationEntity = {
  id: string;
  name: string;
  slug?: string;
  status?: string;
};

const COURSES_URL = "/api/v1/courses/";
const COURSE_DETAIL_URL = (id: string) => `/api/v1/courses/${id}/`;
const NAVIGATIONS_URL = "/api/v1/navigations/";

const richTextJsonSchema: z.ZodType<JSONContent | null> = z.object({}).passthrough().nullable();

const courseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(150, "Name must be at most 150 characters"),

  description: richTextJsonSchema,

  navigation_id: z.string().uuid("Navigation is required"),

  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(150, "Slug must be at most 150 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers and hyphens"),

  image_id: z.string().uuid().nullable().optional(),
  banner_id: z.string().uuid().nullable().optional(),

  tags: z
    .array(
      z.string().trim().min(1, "Tag cannot be empty").max(50, "Each tag must be at most 50 characters")
    )
    .max(20, "You can add up to 20 tags")
    .default([]),

  is_popular: z.boolean().default(false),
});

type CourseFormValues = z.infer<typeof courseSchema>;

type CourseApiPayload = {
  name: string;
  description: string;
  navigation_id: string;
  slug: string;
  image_id?: string | null;
  banner_id?: string | null;
  tags: string;
  is_popular?: boolean;
};

function slugifyCourseName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createEmptyRichText(): JSONContent {
  return {
    type: "doc",
    content: [{ type: "paragraph" }],
  };
}

function parseCourseDescription(value?: string | null): JSONContent {
  if (!value) return createEmptyRichText();

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") return parsed as JSONContent;
    return createEmptyRichText();
  } catch {
    return createEmptyRichText();
  }
}

function parseCourseTags(value?: string | null): string[] {
  if (!value) return [];

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, arr) => arr.findIndex((t) => t.toLowerCase() === tag.toLowerCase()) === index);
}

function stringifyCourseTags(tags: string[]): string {
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, arr) => arr.findIndex((t) => t.toLowerCase() === tag.toLowerCase()) === index)
    .join(", ");
}

function normalizeCourseValues(values: CourseFormValues): CourseFormEntity {
  return {
    name: values.name.trim(),
    description: values.description ?? createEmptyRichText(),
    navigation_id: values.navigation_id,
    slug: values.slug.trim().toLowerCase(),
    image_id: values.image_id ?? null,
    banner_id: values.banner_id ?? null,
    tags: values.tags
      .map((tag) => tag.trim())
      .filter(Boolean)
      .filter((tag, index, arr) => arr.findIndex((t) => t.toLowerCase() === tag.toLowerCase()) === index),
    is_popular: values.is_popular,
  };
}

function toCourseApiPayload(values: CourseFormValues): CourseApiPayload {
  const normalized = normalizeCourseValues(values);

  return {
    ...normalized,
    description: JSON.stringify(normalized.description ?? createEmptyRichText()),
    tags: stringifyCourseTags(normalized.tags),
  };
}

function getCourseDefaultValues(course?: CourseEntity | null): CourseFormValues {
  if (!course) {
    return {
      name: "",
      description: createEmptyRichText(),
      navigation_id: "",
      slug: "",
      image_id: null,
      banner_id: null,
      tags: [],
      is_popular: false,
    };
  }

  return {
    name: course.name ?? "",
    description: parseCourseDescription(course.description),
    navigation_id: course.navigation_id ?? "",
    slug: course.slug ?? "",
    image_id: course.image?.id ?? null,
    banner_id: course.banner?.id ?? null,
    tags: parseCourseTags(course.tags),
    is_popular: course.is_popular ?? false,
  };
}

function getCourseErrorMessage(error: any, fallback: string): string {
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

async function fetchCourseById(id: string) {
  const res = await api.get<CourseEntity>(COURSE_DETAIL_URL(id));
  return res.data;
}

async function fetchNavigations() {
  const res = await api.get<PaginatedResponse<NavigationEntity>>(NAVIGATIONS_URL, {
    params: { status: "active", page_size: 200 },
  });
  return res.data;
}

export function CoursesFormPage(props: { mode: "create" | "edit" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();

  const id = props.mode === "edit" ? searchParams.get("id") || "" : "";
  const isEdit = props.mode === "edit";

  const [uploading, setUploading] = React.useState(false);

  const detailQuery = useQuery({
    queryKey: ["courses", "detail", id || null],
    enabled: isEdit && Boolean(id),
    queryFn: async () => fetchCourseById(id),
  });

  const navigationsQuery = useQuery({
    queryKey: ["navigations", "list", "for-course-form"],
    queryFn: fetchNavigations,
    retry: 2,
  });

  React.useEffect(() => {
    if (navigationsQuery.isError) {
      toast.error("Failed to load navigations");
    }
  }, [navigationsQuery.isError]);

  const createMutation = useMutation({
    mutationFn: async (values: CourseFormValues) => {
      const res = await api.post(COURSES_URL, toCourseApiPayload(values));
      return res.data;
    },
    onSuccess: async () => {
      toast.success("Course created");
      await qc.invalidateQueries({ queryKey: ["courses", "list"] });
      router.push("/website/manage-courses");
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(getCourseErrorMessage(error, "Failed to create course"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: CourseFormValues) => {
      const res = await api.put(COURSE_DETAIL_URL(id), toCourseApiPayload(values));
      return res.data;
    },
    onSuccess: async () => {
      toast.success("Course updated");
      await qc.invalidateQueries({ queryKey: ["courses", "list"] });
      await qc.invalidateQueries({ queryKey: ["courses", "detail", id] });
      router.push("/website/manage-courses");
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(getCourseErrorMessage(error, "Failed to update course"));
    },
  });

  const blocked =
    uploading ||
    detailQuery.isFetching ||
    navigationsQuery.isFetching ||
    createMutation.isPending ||
    updateMutation.isPending;

  const entity = detailQuery.data ?? null;

  const defaultValues = React.useMemo<CourseFormValues>(() => {
    if (isEdit && entity) return getCourseDefaultValues(entity);
    return getCourseDefaultValues(null);
  }, [isEdit, entity]);

  const resetKey = React.useMemo(() => {
    if (!isEdit) return "course-create";
    return entity ? `course-edit-${id}-${entity.updated_at ?? "ready"}` : `course-edit-${id}-loading`;
  }, [isEdit, entity, id]);

  const title = isEdit ? "Update Course" : "Add Course";
  const description = isEdit ? "Update the course details." : "Create a new course.";

  const imageInitialUri = entity?.image?.file_url ?? null;
  const bannerInitialUri = entity?.banner?.file_url ?? null;

  const navigations = navigationsQuery.data?.results ?? [];
  const navigationDisabled = blocked || navigationsQuery.isLoading || navigationsQuery.isError;

  return (
    <PageShell
      title={title}
      description={description}
      actions={
        <Button variant="outline" asChild>
          <Link href="/website/manage-courses">Back</Link>
        </Button>
      }
    >
      <FormWizard
        schema={courseSchema}
        defaultValues={defaultValues}
        resetKey={resetKey}
        blocked={blocked}
        externallyBlocked={uploading}
        submitLabel={isEdit ? "Update" : "Create"}
        submitLoading={createMutation.isPending || updateMutation.isPending}
        disableSubmitUntilDirty={isEdit}
        onSubmit={async (values, methods) => {
          try {
            if (isEdit) {
              await updateMutation.mutateAsync(values);
            } else {
              await createMutation.mutateAsync(values);
            }
          } catch (error) {
            handleFormError(error, { setError: methods.setError });
          }
        }}
        render={(methods) => (
          <div className="space-y-6 rounded-lg border p-4">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="grid gap-4 md:grid-cols-2">
                  <InputField
                    label="Name"
                    required
                    placeholder="e.g. Full Stack Development"
                    disabled={blocked}
                    {...methods.register("name", {
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        const nextName = e.target.value;
                        const currentSlug = methods.getValues("slug");

                        methods.setValue("name", nextName, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });

                        if (!isEdit && !currentSlug.trim()) {
                          methods.setValue("slug", slugifyCourseName(nextName), {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }
                      },
                    })}
                    error={methods.formState.errors.name as any}
                  />

                  <InputField
                    label="Slug"
                    required
                    placeholder="e.g. full-stack-development"
                    disabled={blocked}
                    {...methods.register("slug")}
                    error={methods.formState.errors.slug as any}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <SelectField
                    control={methods.control}
                    name="navigation_id"
                    label="Navigation"
                    required
                    disabled={navigationDisabled}
                    placeholder={
                      navigationsQuery.isLoading
                        ? "Loading navigations..."
                        : navigationsQuery.isError
                          ? "Failed to load navigations"
                          : navigations.length === 0
                            ? "No navigations available"
                            : "Select navigation"
                    }
                    options={navigations.map((nav) => ({
                      value: nav.id,
                      label: nav.name,
                    }))}
                  />

                  <Controller
                    control={methods.control}
                    name="tags"
                    render={({ field, fieldState }) => (
                      <TagsInputField
                        label="Tags"
                        value={field.value ?? []}
                        onChange={field.onChange}
                        disabled={blocked}
                        placeholder="Type tag and press Enter"
                        hint="Press Enter or comma to add tags. Click × to remove."
                        error={fieldState.error}
                      />
                    )}
                  />
                </div>

                <div className="rounded-xl border bg-muted/20 p-4">
                  <CheckboxField
                    control={methods.control}
                    name="is_popular"
                    label="Mark as popular course"
                    hint="Popular courses can be highlighted in the UI."
                    disabled={blocked}
                  />
                </div>

                <Controller
                  control={methods.control}
                  name="description"
                  render={({ field, fieldState }) => (
                    <RichTextEditor
                      label="Description"
                      value={field.value}
                      onChange={field.onChange}
                      error={fieldState.error}
                      placeholder="Write course description..."
                      required
                    />
                  )}
                />
              </div>

              <div className="space-y-6">
                <Controller
                  control={methods.control}
                  name="image_id"
                  render={({ field, fieldState }) => (
                    <ImagePickerField
                      title="Course Image"
                      hint="PNG, JPG up to ~5MB"
                      value={field.value}
                      initialUri={imageInitialUri}
                      onChange={(value) => field.onChange(value || null)}
                      error={fieldState.error}
                      onUploadStatusChange={setUploading}
                    />
                  )}
                />

                <Controller
                  control={methods.control}
                  name="banner_id"
                  render={({ field, fieldState }) => (
                    <ImagePickerField
                      title="Banner Image"
                      hint="PNG, JPG up to ~5MB"
                      value={field.value}
                      initialUri={bannerInitialUri}
                      onChange={(value) => field.onChange(value || null)}
                      error={fieldState.error}
                      onUploadStatusChange={setUploading}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        )}
      />
    </PageShell>
  );
}
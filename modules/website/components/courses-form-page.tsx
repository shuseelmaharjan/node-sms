"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/PageShell";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/fields/InputField";
import { CheckboxField } from "@/components/fields/CheckboxField";
import { ImagePickerField } from "@/components/form/ImagePickerField";
import { RichTextEditor } from "@/components/fields/RichTextEditor";
import { TagsInputField } from "@/components/fields/TagsInputField";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import type { NavigationEntity } from "../types/navigation.types";
import {
    createCourse,
    fetchCourseById,
    updateCourse,
} from "../api/course.api";
import { fetchNavigations } from "../api/navigation.api";
import {
    courseFormSchema,
    getCourseDefaultValues,
    slugifyCourseName,
    toCourseApiPayload,
    type CourseFormValues,
} from "../schema/course.schema";
import { getCourseErrorMessage } from "../lib/course-error";
import { SelectField } from "@/components/select";

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
        queryFn: () => fetchCourseById(id),
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
            const payload = toCourseApiPayload(values);
            return createCourse(payload);
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
            const payload = toCourseApiPayload(values);
            return updateCourse(id, payload);
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

    const defaultValues = React.useMemo(() => {
        if (isEdit && entity) return getCourseDefaultValues(entity);
        return getCourseDefaultValues(null);
    }, [isEdit, entity]);

    const resetKey = React.useMemo(() => {
        if (!isEdit) return "course-create";
        return entity ? `course-edit-${id}-${entity.updated_at}` : `course-edit-${id}-loading`;
    }, [isEdit, entity, id]);

    const title = isEdit ? "Update Course" : "Add Course";
    const description = isEdit
        ? "Update the course details."
        : "Create a new course.";

    const imageInitialUri = entity?.image?.file_url ?? null;
    const bannerInitialUri = entity?.banner?.file_url ?? null;

    const navigations = navigationsQuery.data?.results ?? [];
    const navigationDisabled =
        blocked || navigationsQuery.isLoading || navigationsQuery.isError;

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
                schema={courseFormSchema}
                defaultValues={defaultValues}
                resetKey={resetKey}
                blocked={blocked}
                externallyBlocked={uploading}
                submitLabel={isEdit ? "Update" : "Create"}
                submitLoading={createMutation.isPending || updateMutation.isPending}
                disableSubmitUntilDirty={isEdit}
                onSubmit={async (values) => {
                    if (isEdit) {
                        await updateMutation.mutateAsync(values);
                    } else {
                        await createMutation.mutateAsync(values);
                    }
                }}
                render={(methods) => (
                    <div className="space-y-6 p-4 border rounded-lg">
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
                                        options={navigations.map((nav: NavigationEntity) => ({
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
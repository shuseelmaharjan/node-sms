"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Controller } from "react-hook-form";

import { api } from "@/api";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/fields/InputField";
import { RichTextEditor } from "@/components/fields/RichTextEditor";
import { blogSchema, getDefaultValues, toPayload } from "../schema/blog.schema";
import type { BlogEntity } from "../types/blog.types";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";

export function BlogFormPage({ mode }: { mode: "create" | "edit" }) {
    const router = useRouter();
    const params = useSearchParams();
    const id = params.get("id");

    const { data } = useQuery({
        queryKey: ["blog", id],
        enabled: mode === "edit" && !!id,
        queryFn: async () => {
            const res = await api.get(`/api/v1/blogs/${id}/`);
            return res.data as BlogEntity;
        },
    });

    const createMutation = useMutation({
        mutationFn: (v: any) => api.post("/api/v1/blogs/", toPayload(v)),
        onSuccess: () => router.push("/website/manage-blogs"),
    });

    const updateMutation = useMutation({
        mutationFn: (v: any) =>
            api.put(`/api/v1/blogs/${id}/`, toPayload(v)),
        onSuccess: () => router.push("/website/manage-blogs"),
    });

    return (
        <PageShell
            title={mode === "create" ? "Create Blog" : "Edit Blog"}
            description={
                mode === "create"
                    ? "Create a new blog post to share updates, news, or insights with your audience."
                    : "Edit the details of your blog post, including title, content, and publication date."
            }
            actions={[
                <Button variant="outline" onClick={() => router.push("/website/manage-blogs")}>
                    Back to List
                </Button>
            ]}
        >


            <FormWizard
                schema={blogSchema}
                defaultValues={getDefaultValues(data)}
                onSubmit={async (v) => {
                    if (mode === "create") await createMutation.mutateAsync(v);
                    else await updateMutation.mutateAsync(v);
                }}
                render={(methods) => (
                    <div className="space-y-6 rounded-lg border p-4">
                        <InputField label="Title" {...methods.register("title")} required placeholder="Enter title"/>
                        <InputField label="Author" {...methods.register("author")} required placeholder="Enter author"/>

                        <Controller
                            control={methods.control}
                            name="content"
                            render={({ field }) => (
                                <RichTextEditor
                                    label="Content"
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />

                        <InputField
                            label="Published At"
                            type="datetime-local"
                            {...methods.register("published_at")}
                            required
                            placeholder="Select publication date and time"
                        />
                    </div>
                )}
            />
        </PageShell>
    );
}
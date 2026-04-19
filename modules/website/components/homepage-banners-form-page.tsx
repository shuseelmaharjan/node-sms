"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api } from "@/api";
import { PageShell } from "@/components/layout/PageShell";
import { FormWizard } from "@/components/form/FormWizard";
import { InputField } from "@/components/fields/InputField";
import { CheckboxField } from "@/components/fields/CheckboxField";
import { ImagePickerField } from "@/components/form/ImagePickerField";
import { Button } from "@/components/ui/button";
import { handleFormError } from "@/lib/handleFormError";

import {
  homepageBannerSchema,
  type HomepageBannerValues,
} from "../schema/homepage-banner.schema";

import type { HomepageBannerEntity } from "../columns/homepage-banner.columns";

const HOMEPAGE_BANNERS_URL = "/api/v1/homepage-banners/";
const HOMEPAGE_BANNER_DETAIL_URL = (id: string) =>
  `/api/v1/homepage-banners/${id}/`;



type HomepageBannerPayload = {
  title: string;
  subtitle: string;
  description: string;
  image_id: string;
  have_link: boolean;
  link_url: string;
  button_link: string;
};

function getHomepageBannerErrorMessage(error: any, fallback: string): string {
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

function getDefaultValues(
  entity?: HomepageBannerEntity | null
): HomepageBannerValues {
  if (!entity) {
    return {
      title: "",
      subtitle: "",
      description: "",
      image_id: "",
      have_link: false,
      link_url: "",
      button_link: "",
    };
  }

  return {
    title: entity.title ?? "",
    subtitle: entity.subtitle ?? "",
    description: entity.description ?? "",
    image_id: entity.image?.id ?? "",
    have_link: entity.have_link ?? false,
    link_url: entity.link_url ?? "",
    button_link: entity.button_link ?? "",
  };
}

function toPayload(values: HomepageBannerValues): HomepageBannerPayload {
  return {
    title: values.title.trim(),
    subtitle: values.subtitle?.trim() || "",
    description: values.description?.trim() || "",
    image_id: values.image_id,
    have_link: values.have_link,
    link_url: values.have_link ? values.link_url?.trim() || "" : "",
    button_link: values.have_link ? values.button_link?.trim() || "" : "",
  };
}

export function HomepageBannersFormPage(props: { mode: "create" | "edit" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();

  const id = props.mode === "edit" ? searchParams.get("id") || "" : "";
  const isEdit = props.mode === "edit";

  const [uploading, setUploading] = React.useState(false);

  const detailQuery = useQuery({
    queryKey: ["homepage-banners", "detail", id || null],
    enabled: isEdit && Boolean(id),
    queryFn: async () => {
      const res = await api.get<HomepageBannerEntity>(
        HOMEPAGE_BANNER_DETAIL_URL(id)
      );
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: HomepageBannerValues) => {
      const res = await api.post(HOMEPAGE_BANNERS_URL, toPayload(values));
      return res.data;
    },
    onSuccess: async () => {
      toast.success("Homepage banner created");
      await qc.invalidateQueries({ queryKey: ["homepage-banners", "list"] });
      router.push("/website/manage-homepage");
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(
        getHomepageBannerErrorMessage(error, "Failed to create banner")
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: HomepageBannerValues) => {
      const res = await api.put(
        HOMEPAGE_BANNER_DETAIL_URL(id),
        toPayload(values)
      );
      return res.data;
    },
    onSuccess: async () => {
      toast.success("Homepage banner updated");
      await qc.invalidateQueries({ queryKey: ["homepage-banners", "list"] });
      await qc.invalidateQueries({
        queryKey: ["homepage-banners", "detail", id],
      });
      router.push("/website/manage-homepage");
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(
        getHomepageBannerErrorMessage(error, "Failed to update banner")
      );
    },
  });

  const blocked =
    uploading ||
    detailQuery.isFetching ||
    createMutation.isPending ||
    updateMutation.isPending;

  const entity = detailQuery.data ?? null;

  const defaultValues = React.useMemo<HomepageBannerValues>(() => {
    if (isEdit && entity) return getDefaultValues(entity);
    return getDefaultValues(null);
  }, [isEdit, entity]);

  const resetKey = React.useMemo(() => {
    if (!isEdit) return "homepage-banner-create";
    return entity
      ? `homepage-banner-edit-${id}-${entity.updated_at ?? "ready"}`
      : `homepage-banner-edit-${id}-loading`;
  }, [isEdit, entity, id]);

  const title = isEdit ? "Update Homepage Banner" : "Add Homepage Banner";
  const description = isEdit
    ? "Update homepage banner details."
    : "Create a new homepage banner.";

  const imageInitialUri = entity?.image?.file_url ?? null;

  return (
    <PageShell
      title={title}
      description={description}
      actions={
        <Button variant="outline" asChild>
          <Link href="/website/manage-homepage">Back</Link>
        </Button>
      }
    >
      <FormWizard
        schema={homepageBannerSchema}
        defaultValues={defaultValues}
        resetKey={resetKey}
        blocked={blocked}
        externallyBlocked={uploading}
        submitLabel={isEdit ? "Update" : "Create"}
        submitLoading={createMutation.isPending || updateMutation.isPending}
        disableSubmitUntilDirty={isEdit}
        onSubmit={async (values, methods) => {
          try {
            if (isEdit) await updateMutation.mutateAsync(values);
            else await createMutation.mutateAsync(values);
          } catch (error) {
            handleFormError(error, { setError: methods.setError });
          }
        }}
        render={(methods) => {
          const haveLink = methods.watch("have_link");

          React.useEffect(() => {
            if (!haveLink) {
              methods.setValue("link_url", "", { shouldDirty: true });
              methods.setValue("button_link", "", { shouldDirty: true });
            }
          }, [haveLink, methods]);

          return (
            <div className="space-y-6 rounded-lg border p-4">
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField
                      label="Title"
                      required
                      placeholder="Enter banner title"
                      disabled={blocked}
                      {...methods.register("title")}
                      error={methods.formState.errors.title as any}
                    />

                    <InputField
                      label="Subtitle"
                      placeholder="Enter subtitle"
                      disabled={blocked}
                      {...methods.register("subtitle")}
                      error={methods.formState.errors.subtitle as any}
                    />
                  </div>

                  <InputField
                    label="Description"
                    placeholder="Enter description"
                    disabled={blocked}
                    {...methods.register("description")}
                    error={methods.formState.errors.description as any}
                  />

                  <div className="rounded-xl border bg-muted/20 p-4">
                    <CheckboxField
                      control={methods.control}
                      name="have_link"
                      label="Enable banner button link"
                      hint="Turn on if this banner should redirect somewhere."
                      disabled={blocked}
                    />
                  </div>

                  {haveLink ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <InputField
                        label="Link URL"
                        required
                        placeholder="https://example.com"
                        disabled={blocked}
                        {...methods.register("link_url")}
                        error={methods.formState.errors.link_url as any}
                      />

                      <InputField
                        label="Button Label"
                        required
                        placeholder="Learn More"
                        disabled={blocked}
                        {...methods.register("button_link")}
                        error={methods.formState.errors.button_link as any}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="space-y-6">
                  <Controller
                    control={methods.control}
                    name="image_id"
                    render={({ field, fieldState }) => (
                      <ImagePickerField
                        title="Banner Image"
                        required
                        hint="PNG, JPG up to ~5MB"
                        value={field.value}
                        initialUri={imageInitialUri}
                        onChange={(value) => field.onChange(value || "")}
                        error={fieldState.error}
                        onUploadStatusChange={setUploading}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          );
        }}
      />
    </PageShell>
  );
}
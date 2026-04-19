// components/form/GalleryPickerField.tsx
"use client";

import * as React from "react";
import { Controller, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ImagePickerField } from "@/components/form/ImagePickerField";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  control: any;
  name: string; // e.g. "images"
  label?: string;
  disabled?: boolean;
  maxItems?: number;
};

const EMPTY_ITEM = {
  image_id: "",
  caption: "",
};

export function GalleryPickerField({
  control,
  name,
  label,
  disabled,
  maxItems,
}: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const canAddMore = !maxItems || fields.length < maxItems;

  return (
    <div className="space-y-3">
      {label ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            {fields.length} selected
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map((item, index) => (
          <div
            key={item.id}
            className="relative rounded-xl border bg-card p-3 shadow-sm"
          >
            <div className="space-y-3">
              <Controller
                control={control}
                name={`${name}.${index}.image_id`}
                render={({ field, fieldState }) => (
                  <ImagePickerField
                    title={`Image ${index + 1}`}
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error}
                    required
                  />
                )}
              />

              <Controller
                control={control}
                name={`${name}.${index}.caption`}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Caption (optional)"
                    className="h-9 text-sm"
                  />
                )}
              />
            </div>

            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8"
              onClick={() => remove(index)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {canAddMore ? (
          <button
            type="button"
            onClick={() => append(EMPTY_ITEM)}
            disabled={disabled}
            className={cn(
              "flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-4 text-center transition",
              "hover:border-primary/40 hover:bg-primary/5",
              "disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
            )}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-sm">
              <Plus className="h-5 w-5" />
            </div>
            <div className="text-sm font-medium">Add image</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Pick another image for this gallery
            </div>
          </button>
        ) : null}
      </div>
    </div>
  );
}
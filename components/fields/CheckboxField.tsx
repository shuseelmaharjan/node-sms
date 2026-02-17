"use client";

import * as React from "react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { Controller } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function CheckboxField<T extends FieldValues>(props: {
  control: Control<T>;
  name: Path<T>;
  label: React.ReactNode;
  hint?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const id = React.useId();

  return (
    <Controller
      control={props.control}
      name={props.name}
      render={({ field, fieldState }) => {
        const checked = !!field.value;

        return (
          <div className={cn("space-y-2", props.className)}>
            <div className="flex items-start gap-2">
              <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={(v) => field.onChange(!!v)}
                disabled={props.disabled}
              />

              <div className="grid gap-1 leading-none">
                <Label htmlFor={id} className="text-xs sm:text-sm font-medium">
                  {props.label}
                  {props.required ? (
                    <span className="text-destructive ml-0.5">*</span>
                  ) : null}
                </Label>

                {props.hint ? (
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    {props.hint}
                  </p>
                ) : null}
              </div>
            </div>

            {fieldState.error?.message ? (
              <p className="text-[11px] sm:text-xs font-medium text-destructive leading-snug">
                {fieldState.error.message}
              </p>
            ) : null}
          </div>
        );
      }}
    />
  );
}

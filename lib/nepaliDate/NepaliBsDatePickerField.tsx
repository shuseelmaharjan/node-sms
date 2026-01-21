"use client";

import * as React from "react";
import { Controller, type Control, type FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: any;
  label: string;
  disabled?: boolean;
  placeholder?: string; // e.g. "2080-01-15"
  hint?: string;        // optional helper text
};

function isBsDate(value: string) {
  // Simple BS format check: YYYY-MM-DD
  // (Doesn't validate calendar correctness, just shape)
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function NepaliBsDatePickerField<T extends FieldValues>({
  control,
  name,
  label,
  disabled,
  placeholder = "YYYY-MM-DD (BS) e.g. 2080-01-15",
  hint = "Format: YYYY-MM-DD (BS)",
}: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hasError = Boolean(fieldState.error);

        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">{label}</label>

            <Input
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={(e) => {
                // Optional: normalize whitespace
                const v = (e.target.value ?? "").trim();
                field.onChange(v);
                field.onBlur();
              }}
              disabled={disabled}
              placeholder={placeholder}
              className={cn(hasError && "border-destructive focus-visible:ring-destructive")}
              inputMode="numeric"
            />

            {!hasError ? (
              <p className="text-xs text-muted-foreground">
                {hint}
              </p>
            ) : (
              <p className="text-xs text-destructive">{fieldState.error?.message}</p>
            )}
          </div>
        );
      }}
    />
  );
}

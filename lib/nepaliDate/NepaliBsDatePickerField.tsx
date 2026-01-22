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
  placeholder?: string;
  hint?: string;
  required?: boolean;
};

export function NepaliBsDatePickerField<T extends FieldValues>({
  control,
  name,
  label,
  disabled,
  placeholder = "YYYY-MM-DD (BS)",
  hint = "Pick a date (BS)",
  required = false,
}: Props<T>) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const initializedRef = React.useRef(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hasError = Boolean(fieldState.error);

        React.useEffect(() => {
          const el = inputRef.current as any;
          if (!el) return;

          // keep DOM value in sync (uncontrolled input)
          if ((el.value ?? "") !== (field.value ?? "")) {
            el.value = field.value ?? "";
          }

          // init only once
          if (initializedRef.current) return;

          const tryInit = () => {
            if (typeof el.nepaliDatePicker !== "function") return false;

            el.nepaliDatePicker({
              dateFormat: "YYYY-MM-DD",
              closeOnDateSelect: true,
            });

            initializedRef.current = true;
            return true;
          };

          if (tryInit()) return;

          const t = window.setInterval(() => {
            if (tryInit()) window.clearInterval(t);
          }, 100);

          return () => window.clearInterval(t);
        }, [field.value]);

        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {label}
              {required && <span className="text-destructive"> *</span>}
            </label>

            <Input
              ref={inputRef}
              disabled={disabled}
              placeholder={placeholder}
              className={cn(hasError && "border-destructive focus-visible:ring-destructive")}
              // IMPORTANT: let plugin write into the input; we just “read” it              onChange={(e) => field.onChange(e.target.value)}              onInput={(e) => field.onChange((e.target as HTMLInputElement).value)}
              onBlur={() => field.onBlur()}
            />

            {!hasError ? (
              <p className="text-xs text-muted-foreground">{hint}</p>
            ) : (
              <p className="text-xs text-destructive">{fieldState.error?.message}</p>
            )}
          </div>
        );
      }}
    />
  );
}

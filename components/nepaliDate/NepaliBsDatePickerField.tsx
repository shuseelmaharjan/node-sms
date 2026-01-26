"use client";

import * as React from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  disabled?: boolean;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  theme?: "primary" | "default";
};

export function NepaliBsDatePickerField<T extends FieldValues>({
  control,
  name,
  label,
  disabled,
  placeholder = "YYYY-MM-DD (BS)",
  hint = "",
  required = false,
  theme = "primary",
}: Props<T>) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const initializedRef = React.useRef(false);
  const id = React.useId();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hasError = Boolean(fieldState.error);

        // keep DOM input value in sync with RHF value
        React.useEffect(() => {
          const el = inputRef.current;
          if (!el) return;
          const v = (field.value ?? "") as string;
          if (el.value !== v) el.value = v;
        }, [field.value]);

        // init plugin only once
        React.useEffect(() => {
          const el = inputRef.current as any;
          if (!el) return;
          if (initializedRef.current) return;

          const tryInit = () => {
            if (typeof el.nepaliDatePicker !== "function") return false;

            el.nepaliDatePicker({
              dateFormat: "YYYY-MM-DD",
              closeOnDateSelect: true,
              theme: theme === "primary" ? "primary" : "default",
            });

            initializedRef.current = true;
            return true;
          };

          if (tryInit()) return;

          const t = window.setInterval(() => {
            if (tryInit()) window.clearInterval(t);
          }, 100);

          return () => window.clearInterval(t);
        }, [theme]);

        // ✅ CRITICAL: capture plugin changes and push into RHF
        React.useEffect(() => {
          const el = inputRef.current;
          if (!el) return;

          const sync = () => {
            const next = el.value ?? "";
            // update RHF whenever DOM changes (plugin writes directly)
            if ((field.value ?? "") !== next) {
              field.onChange(next);
            }
          };

          el.addEventListener("input", sync);
          el.addEventListener("change", sync);
          el.addEventListener("blur", sync);

          // Some nepali datepickers set value without events.
          // Fallback: small poll while mounted.
          const poll = window.setInterval(sync, 200);

          return () => {
            el.removeEventListener("input", sync);
            el.removeEventListener("change", sync);
            el.removeEventListener("blur", sync);
            window.clearInterval(poll);
          };
        }, [field.onChange, field.value]);

        return (
          <div className="space-y-2">
            <Label htmlFor={id} className="text-xs sm:text-sm font-medium">
              {label}
              {required ? <span className="text-destructive ml-0.5">*</span> : null}
            </Label>

            <Input
              id={id}
              ref={inputRef}
              disabled={disabled}
              placeholder={placeholder}
              className={cn(
                "w-full",
                hasError && "border-destructive focus-visible:ring-destructive/30"
              )}
              // still keep handlers (useful if user types manually)
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={() => field.onBlur()}
              data-npdp-theme={theme}
            />

            {!hasError ? (
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">{hint}</p>
            ) : (
              <p className="text-[11px] sm:text-xs font-medium text-destructive leading-snug">
                {fieldState.error?.message}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}

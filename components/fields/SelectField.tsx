"use client";

import * as React from "react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { Controller } from "react-hook-form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

export function SelectField<T extends FieldValues>(props: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  options: Option[];
  required?: boolean;
  disabled?: boolean;
}) {
  const id = React.useId();

  return (
    <Controller
      control={props.control}
      name={props.name}
      render={({ field, fieldState }) => (
        <div className="space-y-2">
          <Label htmlFor={id} className="text-xs sm:text-sm font-medium">
            {props.label}
            {props.required ? <span className="text-destructive ml-0.5">*</span> : null}
          </Label>

          <Select
            value={field.value ? String(field.value) : ""}
            onValueChange={(v) => field.onChange(v || undefined)}
            disabled={props.disabled}
          >
            <SelectTrigger
              id={id}
              className={cn(
                "w-full",
                fieldState.error && "border-destructive focus-visible:ring-destructive/30"
              )}
            >
              <SelectValue placeholder={props.placeholder ?? `Select ${props.label}`} />
            </SelectTrigger>

            <SelectContent>
              {props.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {fieldState.error?.message ? (
            <p className="text-[11px] sm:text-xs font-medium text-destructive leading-snug">
              {fieldState.error.message}
            </p>
          ) : null}
        </div>
      )}
    />
  );
}

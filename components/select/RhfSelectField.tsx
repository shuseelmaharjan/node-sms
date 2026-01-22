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

type Option = { value: string; label: string };

export function RhfSelectField<T extends FieldValues>(props: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  options: Option[];
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <Controller
      control={props.control}
      name={props.name}
      render={({ field, fieldState }) => (
        <div className="space-y-1">
          <label className="text-sm font-medium">
            {props.label}{" "}
            {props.required ? <span className="text-destructive">*</span> : null}
          </label>

          <Select
            value={field.value ?? ""}
            onValueChange={field.onChange}
            disabled={props.disabled}
          >
            <SelectTrigger className={fieldState.error ? "border-destructive w-full" : "w-full"}>
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
            <p className="text-xs text-destructive">{fieldState.error.message}</p>
          ) : null}
        </div>
      )}
    />
  );
}

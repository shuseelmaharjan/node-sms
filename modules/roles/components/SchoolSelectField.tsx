// components/SchoolSelectField.tsx (or wherever you keep it)
"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SchoolOption = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
};

export function SchoolSelectField(props: {
  label: string;
  required?: boolean;

  /**
   * API value:
   * - school UUID for a specific school
   * - "*" for All (if enabled)
   */
  value: string;
  onChange: (schoolId: string) => void;

  options: SchoolOption[];

  disabled?: boolean;
  error?: { message?: string } | undefined;
  placeholder?: string;

  hideInactive?: boolean;
  disableInactive?: boolean;

  // "All" option behavior
  includeAll?: boolean;
  allValue?: string; // default "*"
  allLabel?: string; // default "All"
}) {
  const {
    label,
    required,
    value,
    onChange,
    options,
    disabled,
    error,
    placeholder,
    hideInactive = false,
    disableInactive = true,
    includeAll = false,
    allValue = "*",
    allLabel = "All",
  } = props;

  const items = React.useMemo(() => {
    const list = hideInactive ? options.filter((s) => s.is_active) : options;

    // active first then name
    const sorted = [...list].sort((a, b) => {
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
      return (a.name || "").localeCompare(b.name || "");
    });

    return sorted;
  }, [options, hideInactive]);

  const selectValue = value || "";

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </div>

      <Select value={selectValue} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={error ? "border-destructive w-full" : "w-full"}>
          <SelectValue placeholder={placeholder ?? "Select school…"} />
        </SelectTrigger>

        <SelectContent>
          {includeAll ? (
            <SelectItem value={allValue}>
              {allLabel}
            </SelectItem>
          ) : null}

          {items.map((s) => (
            <SelectItem
              key={s.id}
              value={s.id}
              disabled={disableInactive ? !s.is_active : false}
            >
              {s.code} — {s.name}
              {!s.is_active ? " (Inactive)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error?.message ? (
        <p className="text-[11px] sm:text-xs font-medium text-destructive leading-snug">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}

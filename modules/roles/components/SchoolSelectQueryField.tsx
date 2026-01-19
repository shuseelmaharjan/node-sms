// modules/org/components/SchoolSelectQueryField.tsx
"use client";

import * as React from "react";
import { SchoolSelectField } from "../components/SchoolSelectField";
import type { SchoolOption } from "../../org/components/SchoolSelectField";
import { useSchoolOptionsQuery } from "../queries/school-options.query";

export function SchoolSelectQueryField(props: {
  label: string;
  required?: boolean;

  /**
   * API value:
   * - UUID or "*"
   */
  value: string;
  onChange: (schoolId: string) => void;

  disabled?: boolean;
  error?: { message?: string } | undefined;
  placeholder?: string;

  hideInactive?: boolean;
  disableInactive?: boolean;

  // "All"
  includeAll?: boolean; // default true (since you asked)
  allLabel?: string; // default "All"
  allValue?: string; // default "*"
}) {
  const {
    includeAll = true,
    allLabel = "All",
    allValue = "*",
    ...rest
  } = props;

  const q = useSchoolOptionsQuery({ pageSize: 200, enabled: true });

  const options: SchoolOption[] = React.useMemo(() => q.data ?? [], [q.data]);

  // Merge disabled state: disable while loading/fetching
  const disabled = Boolean(rest.disabled || q.isLoading || q.isFetching);

  // Prefer showing query error if form doesn't have an error
  const error =
    rest.error ??
    (q.isError
      ? { message: "Failed to load schools. Please refresh." }
      : undefined);

  return (
    <SchoolSelectField
      {...rest}
      includeAll={includeAll}
      allLabel={allLabel}
      allValue={allValue}
      options={options}
      disabled={disabled}
      error={error}
    />
  );
}

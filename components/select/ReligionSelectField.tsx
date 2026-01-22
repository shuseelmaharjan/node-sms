"use client";

import type { Control, FieldValues, Path } from "react-hook-form";
import { RhfSelectField } from "./RhfSelectField";
import { RELIGION_OPTIONS } from "@/common/constants";

export function ReligionSelectField<T extends FieldValues>(props: {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <RhfSelectField
      control={props.control}
      name={props.name}
      label={props.label ?? "Religion"}
      required={props.required}
      disabled={props.disabled}
      options={RELIGION_OPTIONS}
    />
  );
}

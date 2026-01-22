"use client";

import type { Control, FieldValues, Path } from "react-hook-form";
import { RhfSelectField } from "./RhfSelectField";
import { GENDER_OPTIONS } from "@/common/constants";

export function GenderSelectField<T extends FieldValues>(props: {
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
      label={props.label ?? "Gender"}
      required={props.required}
      disabled={props.disabled}
      options={GENDER_OPTIONS}
    />
  );
}

"use client";

import type { Control, FieldValues, Path } from "react-hook-form";
import { RhfSelectField } from "./RhfSelectField";
import { NATIONALITY_OPTIONS } from "@/common/constants";
export function NationalitySelectField<T extends FieldValues>(props: {
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
      label={props.label ?? "Nationality"}
      required={props.required}
      disabled={props.disabled}
      options={NATIONALITY_OPTIONS}
    />
  );
}

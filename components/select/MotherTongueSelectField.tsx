"use client";

import type { Control, FieldValues, Path } from "react-hook-form";
import { RhfSelectField } from "./RhfSelectField";
import { MOTHER_TONGUE_OPTIONS } from "@/common/constants";

export function MotherTongueSelectField<T extends FieldValues>(props: {
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
      label={props.label ?? "Mother Tongue"}
      required={props.required}
      disabled={props.disabled}
      options={MOTHER_TONGUE_OPTIONS}
    />
  );
}

"use client";

import type { Control, FieldValues, Path } from "react-hook-form";
import { SelectField } from "../fields/SelectField";
import { BLOOD_GROUP_OPTIONS } from "@/common/constants";

export function BloodGroupSelectField<T extends FieldValues>(props: {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <SelectField
      control={props.control}
      name={props.name}
      label={props.label ?? "Blood Group"}
      required={props.required}
      disabled={props.disabled}
      options={BLOOD_GROUP_OPTIONS}
    />
  );
}

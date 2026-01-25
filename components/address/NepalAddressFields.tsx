"use client";

import * as React from "react";
import type {
  Control,
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
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

import { InputField } from "../fields/InputField";
import {
  fetchDistricts,
  fetchMunicipalities,
  fetchProvinces,
  type OptionItem,
} from "./api/location.api";

type Props<T extends FieldValues> = {
  title: string; // "Permanent Address" / "Temporary Address"
  control: Control<T>;
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
  watch: UseFormWatch<T>;
  errors: FieldErrors<T>;
  disabled?: boolean;

  /**
   * Where this address lives in your form, example:
   *  - "addresses.0"
   *  - "addresses.1"
   */
  baseName: Path<T>;
};

function getErr(obj: any, path: string): string | undefined {
  // supports "addresses.0.province"
  const parts = path.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur?.message as string | undefined;
}

export function NepalAddressFields<T extends FieldValues>({
  title,
  control,
  register,
  setValue,
  watch,
  errors,
  disabled,
  baseName,
}: Props<T>) {
  const provincePath = `${baseName}.province` as Path<T>;
  const districtPath = `${baseName}.district` as Path<T>;
  const municipalityPath = `${baseName}.municipality` as Path<T>;
  const wardPath = `${baseName}.ward_no` as Path<T>;
  const tolePath = `${baseName}.tole` as Path<T>;

  const provinceValue = watch(provincePath) as unknown as string | undefined;
  const districtValue = watch(districtPath) as unknown as string | undefined;

  const [provinces, setProvinces] = React.useState<OptionItem[]>([]);
  const [districts, setDistricts] = React.useState<OptionItem[]>([]);
  const [municipalities, setMunicipalities] = React.useState<OptionItem[]>([]);

  const [loadingProvince, setLoadingProvince] = React.useState(false);
  const [loadingDistrict, setLoadingDistrict] = React.useState(false);
  const [loadingMunicipality, setLoadingMunicipality] = React.useState(false);

  // Load provinces once
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingProvince(true);
        const data = await fetchProvinces();
        if (!alive) return;
        setProvinces(data);
      } finally {
        if (alive) setLoadingProvince(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Load districts when province changes
  React.useEffect(() => {
    let alive = true;

    // Clear dependent fields/options whenever province changes
    setDistricts([]);
    setMunicipalities([]);
    setValue(districtPath, undefined as any, { shouldDirty: true, shouldValidate: false });
    setValue(municipalityPath, undefined as any, { shouldDirty: true, shouldValidate: false });

    if (!provinceValue) return;

    (async () => {
      try {
        setLoadingDistrict(true);
        const data = await fetchDistricts(provinceValue);
        if (!alive) return;
        setDistricts(data);
      } finally {
        if (alive) setLoadingDistrict(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinceValue]);

  // Load municipalities when district changes
  React.useEffect(() => {
    let alive = true;

    setMunicipalities([]);
    setValue(municipalityPath, undefined as any, { shouldDirty: true, shouldValidate: false });

    if (!districtValue) return;

    (async () => {
      try {
        setLoadingMunicipality(true);
        const data = await fetchMunicipalities({ districtId: districtValue });
        if (!alive) return;
        setMunicipalities(data);
      } finally {
        if (alive) setLoadingMunicipality(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districtValue]);

  const provinceError = getErr(errors, `${baseName}.province`);
  const districtError = getErr(errors, `${baseName}.district`);
  const municipalityError = getErr(errors, `${baseName}.municipality`);

  const wardErrorMsg = getErr(errors, `${baseName}.ward_no`);
  const toleErrorMsg = getErr(errors, `${baseName}.tole`);

  // Convert string error -> FieldError-like shape for InputField
  const wardError = wardErrorMsg ? ({ message: wardErrorMsg } as any) : undefined;
  const toleError = toleErrorMsg ? ({ message: toleErrorMsg } as any) : undefined;

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* Province */}
        <Controller
          control={control}
          name={provincePath}
          render={({ field }) => (
            <FieldSelect
              label="Province"
              required
              disabled={disabled}
              value={field.value ? String(field.value) : ""}
              onValueChange={(v) => field.onChange(v || undefined)}
              loading={loadingProvince}
              options={provinces}
              error={provinceError}
            />
          )}
        />

        {/* District */}
        <Controller
          control={control}
          name={districtPath}
          render={({ field }) => (
            <FieldSelect
              label="District"
              required
              disabled={disabled || !provinceValue}
              value={field.value ? String(field.value) : ""}
              onValueChange={(v) => field.onChange(v || undefined)}
              loading={loadingDistrict}
              options={districts}
              error={districtError}
              placeholder={!provinceValue ? "Select province first" : undefined}
            />
          )}
        />

        {/* Municipality */}
        <Controller
          control={control}
          name={municipalityPath}
          render={({ field }) => (
            <FieldSelect
              label="Municipality"
              required
              disabled={disabled || !districtValue}
              value={field.value ? String(field.value) : ""}
              onValueChange={(v) => field.onChange(v || undefined)}
              loading={loadingMunicipality}
              options={municipalities}
              error={municipalityError}
              placeholder={!districtValue ? "Select district first" : undefined}
            />
          )}
        />

        {/* Ward No (number only) */}
        <InputField
          label="Ward No"
          required
          disabled={disabled}
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="e.g. 12"
          error={wardError}
          {...register(wardPath as any, {
            onChange: (e) => {
              // keep only digits
              e.target.value = String(e.target.value ?? "").replace(/\D/g, "");
            },
          })}
        />

        {/* Tole (required) */}
        <InputField
          label="Tole"
          required
          disabled={disabled}
          placeholder="e.g. Putalisadak"
          error={toleError}
          {...register(tolePath as any)}
        />
      </div>
    </div>
  );
}

function FieldSelect(props: {
  label: string;
  required?: boolean;
  disabled?: boolean;
  value: string;
  onValueChange: (v: string) => void;
  options: OptionItem[];
  loading?: boolean;
  error?: string;
  placeholder?: string;
}) {
  const id = React.useId();

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs sm:text-sm font-medium">
        {props.label}
        {props.required ? <span className="text-destructive ml-0.5">*</span> : null}
      </Label>

      <Select value={props.value} onValueChange={props.onValueChange} disabled={props.disabled}>
        <SelectTrigger
          id={id}
          className={cn("w-full", props.error && "border-destructive focus-visible:ring-destructive/30")}
        >
          <SelectValue
            placeholder={props.loading ? "Loading..." : props.placeholder ?? `Select ${props.label}`}
          />
        </SelectTrigger>

        <SelectContent>
          {props.options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {props.error ? (
        <p className="text-[11px] sm:text-xs font-medium text-destructive leading-snug">
          {props.error}
        </p>
      ) : null}
    </div>
  );
}

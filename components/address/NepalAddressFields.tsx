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

// ✅ Client-side datasets (adjust file name if needed)
import provincesRaw from "./data/provinces.json";
import districtsRaw from "./data/districts.json";

// IMPORTANT: use the correct one that exists in your project
import municipalitiesRaw from "./data/local_levels.json";
// import municipalitiesRaw from "./data/local_level.json";

import typesRaw from "./data/local_level_type.json";

export type OptionItem = { value: string; label: string };

type Province = { province_id: number; name: string; nepali_name: string };
type District = {
  district_id: number;
  name: string;
  nepali_name: string;
  province_id: number;
};
type Municipality = {
  municipality_id: number;
  name: string;
  nepali_name: string;
  district_id: number;
  local_level_type_id: number;
};
type LocalLevelType = {
  local_level_type_id: number;
  name: string;
  nepali_name: string;
};

const PROVINCES = provincesRaw as Province[];
const DISTRICTS = districtsRaw as District[];
const MUNICIPALITIES = municipalitiesRaw as Municipality[];
const TYPES = typesRaw as LocalLevelType[];

const TYPE_BY_ID = new Map(TYPES.map((t) => [t.local_level_type_id, t]));
const DISTRICT_BY_ID = new Map(DISTRICTS.map((d) => [d.district_id, d]));
const MUNICIPALITY_BY_ID = new Map(MUNICIPALITIES.map((m) => [m.municipality_id, m]));

function provincesOptions(): OptionItem[] {
  return [...PROVINCES]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => ({ value: String(p.province_id), label: p.name }));
}

function districtsByProvinceOptions(provinceId: string): OptionItem[] {
  const pid = Number(provinceId);
  return DISTRICTS.filter((d) => d.province_id === pid)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((d) => ({ value: String(d.district_id), label: d.name }));
}

function municipalitiesByDistrictOptions(districtId: string): OptionItem[] {
  const did = Number(districtId);
  return MUNICIPALITIES.filter((m) => m.district_id === did)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((m) => {
      const t = TYPE_BY_ID.get(m.local_level_type_id);
      const label = t ? `${m.name} ${t.name}` : m.name;
      return { value: String(m.municipality_id), label };
    });
}

/**
 * ✅ Key fix for "edit" rendering:
 * Radix Select shows the value ONLY if it's in options.
 * If your API returns district="5" but your districts.json doesn't include 5,
 * Select will look empty. So we inject a fallback option.
 */
function ensureSelectedOption(
  options: OptionItem[],
  value?: string,
  label?: string
): OptionItem[] {
  if (!value) return options;
  if (options.some((o) => o.value === value)) return options;
  return [{ value, label: label ?? `Unknown (ID: ${value})` }, ...options];
}

type Props<T extends FieldValues> = {
  title: string;
  control: Control<T>;
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
  watch: UseFormWatch<T>;
  errors: FieldErrors<T>;
  disabled?: boolean;
  baseName: Path<T>;
};

function getErr(obj: any, path: string): string | undefined {
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
  const municipalityValue = watch(municipalityPath) as unknown as string | undefined;

  const [provinces, setProvinces] = React.useState<OptionItem[]>([]);
  const [districts, setDistricts] = React.useState<OptionItem[]>([]);
  const [municipalities, setMunicipalities] = React.useState<OptionItem[]>([]);

  // used to avoid clearing on first paint (edit mode)
  const hydratedRef = React.useRef(false);

  // Load provinces once
  React.useEffect(() => {
    setProvinces(provincesOptions());
  }, []);

  /**
   * ✅ If your backend sends municipality but district/province are missing,
   * we can derive them from dataset (only works when JSON contains those IDs).
   */
  React.useEffect(() => {
    // If municipality exists but district/province missing
    if (municipalityValue) {
      const m = MUNICIPALITY_BY_ID.get(Number(municipalityValue));
      if (m) {
        if (!districtValue) {
          setValue(districtPath, String(m.district_id) as any, {
            shouldDirty: false,
            shouldValidate: false,
          });
        }
        const d = DISTRICT_BY_ID.get(m.district_id);
        if (d && !provinceValue) {
          setValue(provincePath, String(d.province_id) as any, {
            shouldDirty: false,
            shouldValidate: false,
          });
        }
      }
    }

    // If district exists but province missing
    if (districtValue && !provinceValue) {
      const d = DISTRICT_BY_ID.get(Number(districtValue));
      if (d) {
        setValue(provincePath, String(d.province_id) as any, {
          shouldDirty: false,
          shouldValidate: false,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [municipalityValue, districtValue]);

  /**
   * ✅ Province -> District options
   * Also inject fallback selected district if missing in JSON.
   */
  React.useEffect(() => {
    if (!provinceValue) {
      setDistricts([]);
      setMunicipalities([]);

      // Clear dependent fields only AFTER hydration (user action)
      if (hydratedRef.current) {
        setValue(districtPath, "" as any, { shouldDirty: true, shouldValidate: false });
        setValue(municipalityPath, "" as any, { shouldDirty: true, shouldValidate: false });
      }
      return;
    }

    const opts = districtsByProvinceOptions(provinceValue);
    const optsWithSelected = ensureSelectedOption(
      opts,
      districtValue,
      districtValue ? `Selected district (ID: ${districtValue})` : undefined
    );
    setDistricts(optsWithSelected);

    // If user changed province and district is not valid, clear it (after hydration)
    if (hydratedRef.current && districtValue) {
      const ok = opts.some((d) => d.value === districtValue);
      if (!ok) {
        setValue(districtPath, "" as any, { shouldDirty: true, shouldValidate: false });
        setValue(municipalityPath, "" as any, { shouldDirty: true, shouldValidate: false });
        setMunicipalities([]);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinceValue, districtValue]);

  /**
   * ✅ District -> Municipality options
   * Also inject fallback selected municipality if missing in JSON.
   */
  React.useEffect(() => {
    if (!districtValue) {
      setMunicipalities([]);

      if (hydratedRef.current) {
        setValue(municipalityPath, "" as any, { shouldDirty: true, shouldValidate: false });
      }
      return;
    }

    const opts = municipalitiesByDistrictOptions(districtValue);
    const optsWithSelected = ensureSelectedOption(
      opts,
      municipalityValue,
      municipalityValue ? `Selected municipality (ID: ${municipalityValue})` : undefined
    );
    setMunicipalities(optsWithSelected);

    // If user changed district and municipality is not valid, clear it (after hydration)
    if (hydratedRef.current && municipalityValue) {
      const ok = opts.some((m) => m.value === municipalityValue);
      if (!ok) {
        setValue(municipalityPath, "" as any, { shouldDirty: true, shouldValidate: false });
      }
    }

    // Mark hydrated after first district options + municipality options pass
    if (!hydratedRef.current) hydratedRef.current = true;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districtValue, municipalityValue]);

  const provinceError = getErr(errors, `${baseName}.province`);
  const districtError = getErr(errors, `${baseName}.district`);
  const municipalityError = getErr(errors, `${baseName}.municipality`);

  const wardErrorMsg = getErr(errors, `${baseName}.ward_no`);
  const toleErrorMsg = getErr(errors, `${baseName}.tole`);

  const wardError = wardErrorMsg ? ({ message: wardErrorMsg } as any) : undefined;
  const toleError = toleErrorMsg ? ({ message: toleErrorMsg } as any) : undefined;

  // Hidden field paths
  const idPath = `${baseName}.id` as Path<T>;
  const addressTypePath = `${baseName}.address_type` as Path<T>;
  const countryPath = `${baseName}.country` as Path<T>;
  const streetPath = `${baseName}.street` as Path<T>;
  const houseNoPath = `${baseName}.house_no` as Path<T>;
  const postalCodePath = `${baseName}.postal_code` as Path<T>;
  const isPrimaryPath = `${baseName}.is_primary` as Path<T>;

  return (
    <div className="rounded-lg border p-3 space-y-3">
      {/* Hidden fields to preserve data */}
      <input type="hidden" {...register(idPath as any)} />
      <input type="hidden" {...register(addressTypePath as any)} />
      <input type="hidden" {...register(countryPath as any)} />
      <input type="hidden" {...register(streetPath as any)} />
      <input type="hidden" {...register(houseNoPath as any)} />
      <input type="hidden" {...register(postalCodePath as any)} />
      <input type="hidden" {...register(isPrimaryPath as any)} />

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
              onValueChange={(v) => field.onChange(v || "")}
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
              onValueChange={(v) => field.onChange(v || "")}
              options={districts}
              error={districtError}
              placeholder={!provinceValue ? "Select province first" : "Select District"}
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
              onValueChange={(v) => field.onChange(v || "")}
              options={municipalities}
              error={municipalityError}
              placeholder={!districtValue ? "Select district first" : "Select Municipality"}
            />
          )}
        />

        {/* Ward No */}
        <InputField
          label="Ward No"
          required
          disabled={disabled}
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Ward No."
          error={wardError}
          {...register(wardPath as any, {
            onChange: (e) => {
              e.target.value = String(e.target.value ?? "").replace(/\D/g, "");
            },
          })}
        />

        {/* Tole */}
        <InputField
          label="Tole"
          required
          disabled={disabled}
          placeholder="Tole"
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

      {props.error ? (
        <p className="text-[11px] sm:text-xs font-medium text-destructive leading-snug">
          {props.error}
        </p>
      ) : null}
    </div>
  );
}

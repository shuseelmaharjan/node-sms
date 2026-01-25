import { api } from "@/api";

export type OptionItem = { label: string; value: string; [k: string]: any };

type ProvinceDTO = {
  province_id: number;
  name: string;
  nepali_name: string;
};

type DistrictDTO = {
  district_id: number;
  name: string;
  nepali_name: string;
  province_id: number;
};

type LocalLevelTypeDTO = {
  local_level_type_id: number;
  name: string;
  nepali_name: string;
};

type MunicipalityDTO = {
  municipality_id: number;
  name: string;
  nepali_name: string;
  district_id: number;
  local_level_type_id: number;
  label?: string;
  nepali_label?: string;
  local_level_type?: LocalLevelTypeDTO | null;
};

export async function fetchProvinces(): Promise<OptionItem[]> {
  const res = await api.get<ProvinceDTO[]>("/api/v1/provinces/");
  return (res.data ?? []).map((p) => ({
    value: String(p.province_id),
    label: p.name, // or `${p.name} (${p.nepali_name})`
    raw: p,
  }));
}

export async function fetchDistricts(provinceId: string): Promise<OptionItem[]> {
  const res = await api.get<DistrictDTO[]>("/api/v1/districts/", {
    params: { province_id: provinceId },
  });

  return (res.data ?? []).map((d) => ({
    value: String(d.district_id),
    label: d.name,
    raw: d,
  }));
}

export async function fetchMunicipalities(args: {
  districtId?: string;
  provinceId?: string;
}): Promise<OptionItem[]> {
  const res = await api.get<MunicipalityDTO[]>("/api/v1/municipalities/", {
    params: {
      ...(args.districtId ? { district_id: args.districtId } : {}),
      ...(args.provinceId ? { province_id: args.provinceId } : {}),
    },
  });

  return (res.data ?? []).map((m) => ({
    value: String(m.municipality_id),
    // server now gives label like "Aamchowk Rural Municipality"
    label: m.label ?? m.name,
    raw: m,
  }));
}

import { api } from "@/api";

export type OptionItem = { label: string; value: string; [k: string]: any };

// Handle both single array [{ label, value }] and nested array [[{ label, value }]]
function unwrap<T>(data: any): T[] {
  if (!Array.isArray(data)) return [];
  
  // If data is empty, return empty array
  if (data.length === 0) return [];
  
  // If first element is an array, unwrap it (nested case)
  const first = data[0];
  if (Array.isArray(first)) {
    return first;
  }
  
  // Otherwise, data is already a flat array
  return data;
}

export async function fetchProvinces() {
  const res = await api.get<any>("/api/v1/provinces/");
  return unwrap<OptionItem>(res.data);
}

export async function fetchDistricts(province: string) {
  const res = await api.get<any>("/api/v1/districts/", { params: { province } });
  return unwrap<OptionItem>(res.data);
}

export async function fetchMunicipalities(district: string) {
  const res = await api.get<any>("/api/v1/municipalities/", { params: { district } });
  return unwrap<OptionItem>(res.data);
}

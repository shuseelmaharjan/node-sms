import provincesRaw from "./data/provinces.json";
import districtsRaw from "./data/districts.json";
import municipalitiesRaw from "./data/local_levels.json";
import typesRaw from "./data/local_level_type.json";

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

type IdValue = string | number | null | undefined;

type Props = {
  municipality?: IdValue;
  district?: IdValue;
  province?: IdValue;
  separator?: string;
  className?: string;
};

const PROVINCES = provincesRaw as Province[];
const DISTRICTS = districtsRaw as District[];
const MUNICIPALITIES = municipalitiesRaw as Municipality[];
const TYPES = typesRaw as LocalLevelType[];

const PROVINCE_BY_ID = new Map(PROVINCES.map((p) => [p.province_id, p]));
const DISTRICT_BY_ID = new Map(DISTRICTS.map((d) => [d.district_id, d]));
const MUNICIPALITY_BY_ID = new Map(MUNICIPALITIES.map((m) => [m.municipality_id, m]));
const TYPE_BY_ID = new Map(TYPES.map((t) => [t.local_level_type_id, t]));

function toId(value: IdValue): number | null {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

function formatFallback(id: number | null) {
  if (!id) return "-";
  return `Unknown (ID: ${id})`;
}

export function NepalAddressLine({
  municipality,
  district,
  province,
  separator = ", ",
  className,
}: Props) {
  const municipalityId = toId(municipality);
  const districtId = toId(district);
  const provinceId = toId(province);

  const m = municipalityId ? MUNICIPALITY_BY_ID.get(municipalityId) : undefined;
  const d = districtId
    ? DISTRICT_BY_ID.get(districtId)
    : m
      ? DISTRICT_BY_ID.get(m.district_id)
      : undefined;
  const p = provinceId
    ? PROVINCE_BY_ID.get(provinceId)
    : d
      ? PROVINCE_BY_ID.get(d.province_id)
      : undefined;
  const t = m ? TYPE_BY_ID.get(m.local_level_type_id) : undefined;

  const municipalityLabel = m
    ? `${m.name}${t ? ` ${t.name}` : ""}`
    : formatFallback(municipalityId);
  const districtLabel = d ? d.name : formatFallback(districtId);
  const provinceLabel = p ? p.name : formatFallback(provinceId);

  return (
    <span className={className}>
      {[municipalityLabel, districtLabel, provinceLabel].join(separator)}
    </span>
  );
}

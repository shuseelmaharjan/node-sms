import { api } from "@/api";
import type { PaginatedResponse } from "@/types/api";

export type AdminListItem = {
  id: string;
  serial?: number;
  phone: string;
  email: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  role: "admin" | "superadmin";
  status: "active" | "inactive";
  username: string;
  profile_status: "complete" | "incomplete";
};

export type SchoolEntity = {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  is_active: boolean;
  created_at: string;
  logo_file?: { id: string; file_url: string } | null;
  pan_number?: string;
  registration_number?: string;
  pan_document_file?: { id: string; file_url: string } | null;
  registration_document_file?: { id: string; file_url: string } | null;
};

export type AdminDetail = AdminListItem & {
  owned_schools: SchoolEntity[];
  profile: any | null;
};

const ADMINS_LIST = "/api/v1/accounts/admins/";
const ADMIN_DETAIL = (id: string) => `/api/v1/accounts/admins/${id}/`;
const ADMIN_DELETE = (id: string) => `/api/v1/accounts/admins/${id}/delete/`;

// New direct endpoints
const PERSONAL_INFO = "/api/v1/accounts/personal-info/";
const PERSONAL_INFO_DETAIL = (userId: string) => `/api/v1/accounts/personal-info/${userId}/`;

const SCHOOL_INFO = "/api/v1/accounts/school-info/";
const SCHOOL_INFO_DETAIL = (schoolId: string) => `/api/v1/accounts/school-info/${schoolId}/`;

const CLIENT_INFO = "/api/v1/accounts/client-info/";
const CLIENT_INFO_DETAIL = (userId: string) => `/api/v1/accounts/client-info/${userId}/`;

export async function fetchAdmins(params: {
  page: number;
  page_size: number;
  search?: string;
  ordering?: string;
  [k: string]: any;
}) {
  const res = await api.get<PaginatedResponse<AdminListItem>>(ADMINS_LIST, { params });
  return res.data;
}

export async function fetchAdminDetail(id: string) {
  const res = await api.get<AdminDetail>(ADMIN_DETAIL(id));
  return res.data;
}

export async function deleteAdmin(id: string) {
  await api.delete(ADMIN_DELETE(id));
}

// Personal Info Operations
export async function getPersonal(userId: string) {
  const res = await api.get(PERSONAL_INFO_DETAIL(userId));
  return res.data;
}

export async function createPersonal(payload: {
  phone: string;
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
}) {
  const res = await api.post(PERSONAL_INFO, payload);
  return res.data as {
    user_id: string;
    username: string;
    role: string;
    status: string;
    message: string;
  };
}

export async function updatePersonal(
  userId: string,
  payload: {
    phone: string;
    email: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
  }
) {
  const res = await api.put(PERSONAL_INFO_DETAIL(userId), payload);
  return res.data;
}

// School Info Operations
export async function getSchool(schoolId: string) {
  const res = await api.get(SCHOOL_INFO_DETAIL(schoolId));
  return res.data;
}

export async function createSchool(payload: {
  owner_id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo_file: string | null;
  pan_number: string;
  registration_number: string;
  pan_document_file: string | null;
  registration_document_file: string | null;
  is_active: boolean;
}) {
  const res = await api.post(SCHOOL_INFO, payload);
  return res.data as { school_id: string; owner_id: string; message: string };
}

export async function updateSchool(schoolId: string, payload: any) {
  const res = await api.put(SCHOOL_INFO_DETAIL(schoolId), payload);
  return res.data;
}

// Client Info Operations
export async function getClient(userId: string) {
  const res = await api.get(CLIENT_INFO_DETAIL(userId));
  return res.data;
}

export async function createClient(payload: any) {
  const res = await api.post(CLIENT_INFO, payload);
  return res.data as { profile_id: string; message: string };
}

export async function updateClient(userId: string, payload: any) {
  const res = await api.put(CLIENT_INFO_DETAIL(userId), payload);
  return res.data;
}

// Legacy functions for backward compatibility (will be removed)
export const createAdminPersonal = createPersonal;
export const updateAdminPersonal = updatePersonal;
export const createAdminSchool = createSchool;
export const updateAdminSchool = updateSchool;
export const createAdminClient = createClient;
export const updateAdminClient = updateClient;

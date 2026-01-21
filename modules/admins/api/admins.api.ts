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

// Wizard endpoints
const CREATE_PERSONAL = "/api/v1/accounts/create-admin/personal-info/";
const UPDATE_PERSONAL = (userId: string) =>
  `/api/v1/accounts/create-admin/personal-info/${userId}/`;

const CREATE_SCHOOL = "/api/v1/accounts/create-admin/school-info/";
const UPDATE_SCHOOL = (schoolId: string) =>
  `/api/v1/accounts/create-admin/school-info/${schoolId}/`;

const CREATE_CLIENT = "/api/v1/accounts/create-admin/client-info/";
const UPDATE_CLIENT = (userId: string) =>
  `/api/v1/accounts/create-admin/client-info/${userId}/`;

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

// Step 1
export async function createAdminPersonal(payload: {
  phone: string;
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
}) {
  const res = await api.post(CREATE_PERSONAL, payload);
  return res.data as {
    user_id: string;
    username: string;
    role: string;
    status: string;
    message: string;
  };
}

export async function updateAdminPersonal(
  userId: string,
  payload: {
    phone: string;
    email: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
  }
) {
  const res = await api.put(UPDATE_PERSONAL(userId), payload);
  return res.data;
}

// Step 2
export async function createAdminSchool(payload: {
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
  const res = await api.post(CREATE_SCHOOL, payload);
  return res.data as { school_id: string; owner_id: string; message: string };
}

export async function updateAdminSchool(schoolId: string, payload: any) {
  const res = await api.put(UPDATE_SCHOOL(schoolId), payload);
  return res.data;
}

// Step 3
export async function createAdminClient(payload: any) {
  const res = await api.post(CREATE_CLIENT, payload);
  return res.data as { profile_id: string; message: string };
}

export async function updateAdminClient(userId: string, payload: any) {
  const res = await api.put(UPDATE_CLIENT(userId), payload);
  return res.data;
}

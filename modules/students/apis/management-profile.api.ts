import { api } from "@/api";

import type {
  ManagedAddress,
  ManagedAddressType,
  ManagedDocument,
  ManagedGuardian,
  ManagedHealth,
  ManagedProfile,
  ManagedUser,
  PersonalInfo,
} from "../types/management-profile.types";

/**
 * This matches the API paths supplied for this feature.
 * Change this single constant if your backend removes the duplicated `v1`.
 */
const MANAGEMENT_API_PREFIX = "/api/v1/management";

const managementBase = (userId: string) =>
  `${MANAGEMENT_API_PREFIX}/users/${encodeURIComponent(userId)}`;

export const managementProfileKeys = {
  all: ["management-profile"] as const,
  detail: (userId: string) =>
    [...managementProfileKeys.all, userId] as const,
  personalInfo: (userId: string) =>
    [...managementProfileKeys.detail(userId), "personal-info"] as const,
  address: (userId: string, addressType: ManagedAddressType) =>
    [
      ...managementProfileKeys.detail(userId),
      "address",
      addressType,
    ] as const,
  guardians: (userId: string) =>
    [...managementProfileKeys.detail(userId), "guardians"] as const,
  documents: (userId: string) =>
    [...managementProfileKeys.detail(userId), "documents"] as const,
  health: (userId: string) =>
    [...managementProfileKeys.detail(userId), "health"] as const,
};

export type IdentityPayload = {
  first_name: string;
  middle_name: string;
  last_name: string;
};

export type ProfilePicturePayload = {
  profile_picture_file: string | null;
};

export type PersonalInfoPayload = Omit<
  PersonalInfo,
  "id" | "created_at" | "updated_at"
>;

export type AddressPayload = Omit<ManagedAddress, "id" | "address_type">;

export type GuardianPayload = Omit<ManagedGuardian, "id">;

export type DocumentPayload = {
  document_type: string;
  file: string;
  issued_by: string;
  issued_date: string;
  expiry_date: string;
  remarks: string;
};

export type UpdatePersonalInfoPayload = {
  date_of_birth_in_ad: string;
  date_of_birth_in_bs: string;
  gender: string;
  blood_group: string;
  nationality: string;
  religion: string;
  mother_tongue: string;
  citizenship_no: string;
  pan_no: string;
};
export type HealthPayload = Omit<ManagedHealth, "id">;

export const managementProfileApi = {
  getProfile: async (userId: string) => {
    const response = await api.get<ManagedProfile>(
      `${managementBase(userId)}/profile/`
    );
    return response.data;
  },

  updateIdentity: async (userId: string, payload: IdentityPayload) => {
    const response = await api.patch<ManagedUser>(
      `${managementBase(userId)}/identity/`,
      payload
    );
    return response.data;
  },

  updateProfilePicture: async (
    userId: string,
    payload: ProfilePicturePayload
  ) => {
    const response = await api.patch<ManagedUser>(
      `${managementBase(userId)}/profile-picture/`,
      payload
    );
    return response.data;
  },

  getPersonalInfo: async (userId: string) => {
    const response = await api.get<PersonalInfo>(
      `${managementBase(userId)}/personal-info/`
    );
    return response.data;
  },

  updatePersonalInfo: async (
    userId: string,
    payload: UpdatePersonalInfoPayload
  ) => {
    const response = await api.patch<PersonalInfo>(
      `${managementBase(userId)}/personal-info/`,
      payload
    );

    return response.data;
  },

  getAddress: async (userId: string, addressType: ManagedAddressType) => {
    const response = await api.get<ManagedAddress>(
      `${managementBase(userId)}/addresses/${addressType}/`
    );
    return response.data;
  },

  updateAddress: async (
    userId: string,
    addressType: ManagedAddressType,
    payload: AddressPayload
  ) => {
    const response = await api.patch<ManagedAddress>(
      `${managementBase(userId)}/addresses/${addressType}/`,
      payload
    );
    return response.data;
  },

  getGuardians: async (userId: string) => {
    const response = await api.get<ManagedGuardian[]>(
      `${managementBase(userId)}/guardians/`
    );
    return response.data;
  },

  getGuardian: async (userId: string, guardianId: string) => {
    const response = await api.get<ManagedGuardian>(
      `${managementBase(userId)}/guardians/${encodeURIComponent(
        guardianId
      )}/`
    );
    return response.data;
  },

  updateGuardian: async (
    userId: string,
    guardianId: string,
    payload: GuardianPayload
  ) => {
    const response = await api.patch<ManagedGuardian>(
      `${managementBase(userId)}/guardians/${encodeURIComponent(
        guardianId
      )}/`,
      payload
    );
    return response.data;
  },

  getDocuments: async (userId: string) => {
    const response = await api.get<ManagedDocument[]>(
      `${managementBase(userId)}/documents/`
    );
    return response.data;
  },

  getDocument: async (userId: string, documentId: string) => {
    const response = await api.get<ManagedDocument>(
      `${managementBase(userId)}/documents/${encodeURIComponent(
        documentId
      )}/`
    );
    return response.data;
  },

  createDocument: async (userId: string, payload: DocumentPayload) => {
    const response = await api.post<ManagedDocument>(
      `${managementBase(userId)}/documents/`,
      payload
    );
    return response.data;
  },

  updateDocument: async (
    userId: string,
    documentId: string,
    payload: DocumentPayload
  ) => {
    const response = await api.patch<ManagedDocument>(
      `${managementBase(userId)}/documents/${encodeURIComponent(
        documentId
      )}/`,
      payload
    );
    return response.data;
  },

  getHealth: async (userId: string) => {
    const response = await api.get<ManagedHealth>(
      `${managementBase(userId)}/health/`
    );
    return response.data;
  },

  updateHealth: async (userId: string, payload: HealthPayload) => {
    const response = await api.patch<ManagedHealth>(
      `${managementBase(userId)}/health/`,
      payload
    );
    return response.data;
  },
};

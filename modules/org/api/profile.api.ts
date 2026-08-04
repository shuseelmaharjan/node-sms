import { api } from "@/api";

import type {
  AccountProfile,
  EmailChangeRequestPayload,
  EmailChangeRequestResponse,
  EmailChangeVerifyPayload,
  EmailChangeVerifyResponse,
  ProfileUpdateResponse,
  UpdateBasicInfoPayload,
  UpdateProfilePicturePayload,
} from "../types/profile.types";

export const profileQueryKey = ["account", "me"] as const;

export const profileApi = {
  getMe: async (): Promise<AccountProfile> => {
    const response = await api.get<AccountProfile>(
      "/api/v1/accounts/account/me/"
    );
    return response.data;
  },

  updateBasicInfo: async (
    payload: UpdateBasicInfoPayload
  ): Promise<ProfileUpdateResponse> => {
    const response = await api.patch<ProfileUpdateResponse>(
      "/api/v1/accounts/account/me/basic-info/",
      payload
    );
    return response.data;
  },

  updateProfilePicture: async (
    payload: UpdateProfilePicturePayload
  ): Promise<ProfileUpdateResponse> => {
    const response = await api.patch<ProfileUpdateResponse>(
      "/api/v1/accounts/account/me/profile-picture/",
      payload
    );
    return response.data;
  },

  requestEmailChange: async (
    payload: EmailChangeRequestPayload
  ): Promise<EmailChangeRequestResponse> => {
    const response = await api.post<EmailChangeRequestResponse>(
      "/api/v1/accounts/account/me/email/change/request/",
      payload
    );
    return response.data;
  },

  verifyEmailChange: async (
    payload: EmailChangeVerifyPayload
  ): Promise<EmailChangeVerifyResponse> => {
    const response = await api.post<EmailChangeVerifyResponse>(
      "/api/v1/accounts/account/me/email/change/verify/",
      payload
    );
    return response.data;
  },
};

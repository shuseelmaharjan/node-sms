import { api } from "@/api";
import type { ChangePasswordValues } from "../schema/change-password.schema";

export type ChangePasswordResponse = {
  changed: boolean;
  message: string;
};

export const changePasswordApi = {
  change: async (payload: ChangePasswordValues) => {
    const res = await api.post<ChangePasswordResponse>(
      "/api/v1/accounts/auth/password/change/",
      payload
    );
    return res.data;
  },
};

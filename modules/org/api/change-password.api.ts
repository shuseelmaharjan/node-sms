import { api } from "@/api";
import type { ChangePasswordValues } from "../schema/change-password.schema";

export type ChangePasswordResponse = { detail: string };

export const changePasswordApi = {
  change: async (payload: ChangePasswordValues) => {
    const res = await api.post<ChangePasswordResponse>(
      "/api/v1/profile/change-password/",
      payload
    );
    return res.data;
  },
};

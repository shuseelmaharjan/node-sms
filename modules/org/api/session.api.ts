import { api } from "@/api";
import {
  listSessionsResponseSchema,
  revokeResponseSchema,
  type ListSessionsResponse,
  type RevokeResponse,
} from "../schema/session.schema";

export const sessionsApi = {
  list: async (): Promise<ListSessionsResponse> => {
    const res = await api.get(`/api/auth/sessions/`);
    // Validate shape (helps catch backend changes early)
    return listSessionsResponseSchema.parse(res.data);
  },

  revokeOne: async (sessionId: string): Promise<RevokeResponse> => {
    const res = await api.post(`/api/auth/sessions/${sessionId}/revoke/`);
    return revokeResponseSchema.parse(res.data);
  },

  revokeOthers: async (): Promise<RevokeResponse> => {
    const res = await api.post(`/api/auth/sessions/revoke-others/`);
    return revokeResponseSchema.parse(res.data);
  },
};

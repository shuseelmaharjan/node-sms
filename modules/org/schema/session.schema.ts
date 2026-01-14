import { z } from "zod";

export const sessionSchema = z.object({
    id: z.string().uuid(),
    client_type: z.string(),
    device_id: z.string().nullable().optional(),
    device_name: z.string().nullable().optional(),
    os_name: z.string().nullable().optional(),
    os_version: z.string().nullable().optional(),
    app_version: z.string().nullable().optional(),
    ip_address: z.string().nullable().optional(),
    user_agent: z.string().nullable().optional(),
    created_at: z.string(),
    last_seen_at: z.string().nullable().optional(),
    revoked_at: z.string().nullable().optional(),
    refresh_expires_at: z.string().nullable().optional(),
    is_active: z.boolean(),
    is_current: z.boolean(),

});

export type Session = z.infer<typeof sessionSchema>;

export const listSessionsResponseSchema = z.object({
    sessions: z.array(sessionSchema),
});
export type ListSessionsResponse = z.infer<typeof listSessionsResponseSchema>;

export const revokeResponseSchema = z.object({
    detail: z.string(),
    revoked_session_id: z.string().uuid(),
});

export type RevokeResponse = z.infer<typeof revokeResponseSchema>;

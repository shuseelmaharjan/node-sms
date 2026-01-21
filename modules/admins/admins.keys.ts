export const adminsKeys = {
  all: ["admins"] as const,
  list: (params: any) => ["admins", "list", params] as const,
  detail: (id: string | null | undefined) => ["admins", "detail", id ?? null] as const,
};

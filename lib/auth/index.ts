// lib/auth/index.ts
export { useAuth } from "./hooks";
export { useAuthGuard } from "./guard";
export { RequireAuth, AuthGuardLoader } from "./components";
export { useAuthStore } from "./store";
export { login, logout, bootstrapSession } from "./session";
export { authApi } from "./api";
export type { User } from "./store";
export type { LoginResponse, MeResponse } from "./api";

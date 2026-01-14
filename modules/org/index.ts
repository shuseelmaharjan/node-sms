export { SchoolSettings } from "./components/component";
export { schoolSchema, schoolCreateDefaults } from "./schema/schema";
export type { School, SchoolFormValues } from "./schema/schema";
// --- Session ---
export { SessionsSettings } from "./components/SessionsSettings";
export type { Session } from "./schema/session.schema";

// --- Change Password ---
export { ChangePasswordSettings } from "./components/ChangePasswordSettings";
export {
  changePasswordSchema,
  changePasswordDefaults,
} from "./schema/change-password.schema";
export type { ChangePasswordValues } from "./schema/change-password.schema";

// --- Organization Schools ---
export * from "./components/organization-schools";
export * from "./schema/organization-schools.schema";




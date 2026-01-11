// Types
export type { Campus } from "./types/campuses.types";
export type { School } from "./types/schools.types";

// Schemas
export { campusSchema, type CampusFormValues } from "./schemas/campuses.schema";
export { schoolSchema, type SchoolFormValues } from "./schemas/schools.schema";

// API & Query Keys
export { campusesApi, campusesKeys } from "./api/campuses.api";
export { schoolsApi, schoolsKeys } from "./api/schools.api";

// Components
export { CampusForm } from "./components/CampusForm";
export { CampusesTable } from "./components/CampusesTable";
export { SchoolForm } from "./components/SchoolForm";
export { SchoolsTable } from "./components/SchoolsTable";

// Columns
export { createCampusColumns } from "./columns/campus-columns";
export { createSchoolColumns } from "./columns/school-columns";

// Layout
export { CampusesLayout } from "./layout/CampusesLayout";
export { SchoolsLayout } from "./layout/SchoolsLayout";

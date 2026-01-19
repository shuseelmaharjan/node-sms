import type { LucideIcon } from "lucide-react";
import { 
  Home,
  Users,
  GraduationCap,
  UserCheck,
  BookOpen,
  Calendar,
  BarChart3,
  Settings,
  Building,
  UserCheck2
} from "lucide-react";

export type NavChild = {
  label: string;
  href: string;
  exactMatch?: boolean;
  match?: Array<string | RegExp>;
} | {
  label: string;
  children: NavChild[];
};

export type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  exactMatch?: boolean;
  match?: Array<string | RegExp>;
} | {
  label: string;
  icon: LucideIcon;
  children: NavChild[];
};

export const navconfig: NavItem[] = [
  {
    label: "Overview",
    icon: Home,
    href: "/dashboard",
    exactMatch: true,
  },
  {
    label: "Organizations",
    icon: Building, 
    children: [
      { label: "Schools", href: "/dashboard/schools" },
      { label: "School Settings", href: "/dashboard/school-settings" },
    ],
  },
  {
    label: "Roles & Permissions",
    icon: UserCheck2,
    children: [
      { label: "Roles", href: "/dashboard/roles" },
      { label: "Add Role", href: "/dashboard/roles/add" },
      { label: "Manage Permissions", href: "/dashboard/roles/permissions" },
    ],
  },
  {
    label: "Students",
    icon: Users,
    children: [
      { label: "All Students", href: "/dashboard/students" },
      { label: "Admissions", href: "/dashboard/students/admissions" },
      { label: "Enrollments", href: "/dashboard/students/enrollments" },
    ],
  },
  {
    label: "Courses",
    icon: GraduationCap,
    children: [
      { label: "All Courses", href: "/dashboard/courses" },
      { label: "Course Management", href: "/dashboard/courses/manage" },
      { label: "Assignments", href: "/dashboard/courses/assignments" },
    ],
  },
  {
    label: "Faculty",
    icon: UserCheck,
    children: [
      { label: "All Faculty", href: "/dashboard/faculty" },
      { label: "Departments", href: "/dashboard/faculty/departments" },
      { label: "Schedule", href: "/dashboard/faculty/schedule" },
    ],
  },
  {
    label: "Library",
    icon: BookOpen,
    href: "/dashboard/library",
  },
  {
    label: "Attendance",
    icon: Calendar,
    href: "/dashboard/attendance",
  },
  {
    label: "Reports",
    icon: BarChart3,
    children: [
      { label: "Student Reports", href: "/dashboard/reports/students" },
      { label: "Academic Reports", href: "/dashboard/reports/academic" },
      { label: "Financial Reports", href: "/dashboard/reports/financial" },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
  },
];
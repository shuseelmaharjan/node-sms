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
    href: "/overview",
    exactMatch: true,
  },
  {
    label: "Admins",
    icon: Users,
    href: "/admins",
  },
  {
    label: "Organizations",
    icon: Building, 
    children: [
      { label: "Schools", href: "/schools" },
      { label: "School Settings", href: "/school-settings" },
    ],
  },
  {
    label: "Roles & Permissions",
    icon: UserCheck2,
    children: [
      { label: "Roles", href: "/roles" },
      { label: "Add Role", href: "/roles/add" },
      { label: "Manage Permissions", href: "/roles/permissions" },
    ],
  },
  {
    label: "Students",
    icon: Users,
    children: [
      { label: "All Students", href: "/students" },
      { label: "Admissions", href: "/students/admissions" },
      { label: "Enrollments", href: "/students/enrollments" },
    ],
  },
  {
    label: "Courses",
    icon: GraduationCap,
    children: [
      { label: "All Courses", href: "/courses" },
      { label: "Course Management", href: "/courses/manage" },
      { label: "Assignments", href: "/courses/assignments" },
    ],
  },
  {
    label: "Faculty",
    icon: UserCheck,
    children: [
      { label: "All Faculty", href: "/faculty" },
      { label: "Departments", href: "/faculty/departments" },
      { label: "Schedule", href: "/faculty/schedule" },
    ],
  },
  {
    label: "Library",
    icon: BookOpen,
    href: "/library",
  },
  {
    label: "Attendance",
    icon: Calendar,
    href: "/attendance",
  },
  {
    label: "Reports",
    icon: BarChart3,
    children: [
      { label: "Student Reports", href: "/reports/students" },
      { label: "Academic Reports", href: "/reports/academic" },
      { label: "Financial Reports", href: "/reports/financial" },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    children: [
      { label: "General", href: "/settings/general" },
      { label: "Security", href: "/settings/security" },
      { label: "Change Password", href: "/settings/change-password" },
    ],
  },
];
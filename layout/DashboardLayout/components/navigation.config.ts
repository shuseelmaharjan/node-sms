// layout/DashboardLayout/components/navigation.config.ts
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
  UserCheck2,
} from "lucide-react";

import type { UserRole } from "@/router/routes";

// ---------- Types ----------
export type NavChild =
  | {
      label: string;
      href: string;
      roles?: UserRole[];
      exactMatch?: boolean;
      match?: Array<string | RegExp>;
    }
  | {
      label: string;
      roles?: UserRole[];
      children: NavChild[];
    };

export type NavItem =
  | {
      label: string;
      icon: LucideIcon;
      href: string;
      roles?: UserRole[];
      exactMatch?: boolean;
      match?: Array<string | RegExp>;
    }
  | {
      label: string;
      icon: LucideIcon;
      roles?: UserRole[];
      children: NavChild[];
    };

// ---------- Config ----------
export const navconfig: NavItem[] = [
  {
    label: "Overview",
    icon: Home,
    href: "/overview",
    exactMatch: true,
    // roles omitted => visible to all logged-in users
  },

  // Admins: superadmin can manage all, admin can manage limited scope
  {
    label: "Admins",
    icon: Users,
    href: "/admins",
    roles: ["superadmin", "admin"],
  },

  // Organizations: superadmin/admin
  {
    label: "Organizations",
    icon: Building,
    roles: ["superadmin", "admin"],
    children: [
      { label: "Schools", href: "/schools", roles: ["superadmin", "admin"] },
      { label: "School Settings", href: "/school-settings", roles: ["superadmin", "admin"] },
    ],
  },

  // Roles & Permissions: superadmin only
  {
    label: "Roles & Permissions",
    icon: UserCheck2,
    roles: ["superadmin"],
    children: [
      { label: "Roles", href: "/roles", roles: ["superadmin"] },
      { label: "Add Role", href: "/roles/add", roles: ["superadmin"] },
      { label: "Manage Permissions", href: "/roles/permissions", roles: ["superadmin"] },
    ],
  },

  // Students: broader permissions
  {
    label: "Students",
    icon: Users,
    roles: ["superadmin", "admin", "principal", "coordinator"],
    children: [
      { label: "All Students", href: "/students" },
      { label: "Admissions", href: "/students/admissions", roles: ["superadmin", "admin"]},
      { label: "Enrollments", href: "/students/enrollments", roles: ["superadmin", "admin"] },
    ],
  },

  // Courses: broader permissions  
  {
    label: "Courses",
    icon: GraduationCap,
    roles: ["superadmin", "admin", "principal", "teacher", "coordinator"],
    children: [
      { label: "All Courses", href: "/courses" },
      { label: "Course Management", href: "/courses/manage", roles: ["superadmin", "admin", "principal"] },
      { label: "Assignments", href: "/courses/assignments", roles: ["superadmin", "admin", "teacher"] },
    ],
  },

  // Faculty: broader permissions
  {
    label: "Faculty",
    icon: UserCheck,
    roles: ["superadmin", "admin", "principal", "coordinator"],
    children: [
      { label: "All Faculty", href: "/faculty" },
      { label: "Departments", href: "/faculty/departments" },
      { label: "Schedule", href: "/faculty/schedule" },
    ],
  },

  // Library: broader permissions
  {
    label: "Library",
    icon: BookOpen,
    href: "/library",
    roles: ["superadmin", "admin", "principal"],
  },

  // Attendance: broader permissions
  {
    label: "Attendance",
    icon: Calendar,
    href: "/attendance",
    roles: ["superadmin", "admin", "principal", "teacher", "coordinator"],
  },

  // Reports: broader permissions
  {
    label: "Reports",
    icon: BarChart3,
    roles: ["superadmin", "admin", "principal", "accountant"],
    children: [
      { label: "Student Reports", href: "/reports/students" },
      { label: "Academic Reports", href: "/reports/academic" },
      { label: "Financial Reports", href: "/reports/financial", roles: ["superadmin", "admin", "accountant"] },
    ],
  },

  // Settings
  {
    label: "Settings",
    icon: Settings,
    roles: ["superadmin", "admin"],
    children: [
      { label: "General", href: "/settings/general" },
      { label: "Security", href: "/settings/security" },
      { label: "Change Password", href: "/settings/change-password" },
    ],
  },
];

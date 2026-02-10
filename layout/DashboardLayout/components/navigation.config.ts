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
  HandCoins,
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
    roles: ["superadmin"],
  },

  {
    label: "Users",
    icon: Users,
    children: [
      { label: "Teachers", href: "/teachers", roles: ["principal", "admin"] },
      { label: "Employees", href: "/employee", roles: ["principal", "admin"] },
    ],
  },
  // Organizations: superadmin/admin
  // {
  //   label: "Organizations",
  //   icon: Building,
  //   roles: ["superadmin"],
  //   children: [
  //     { label: "Schools", href: "/schools", roles: ["superadmin"] },
  //     { label: "School Settings", href: "/school-settings", roles: ["superadmin"] },
  //   ],
  // },
  // Academics: broader permissions
  {
    label: "Academics",
    icon: GraduationCap,
    roles: ["admin", "principal"],
    children: [
      { label: "Academic Year", href: "/academic-year", roles: ["admin", "principal"] },
      { label: "Manage Classrooms", href: "/manage-classroom", roles: ["admin", "principal"] },
      { label: "Class Schedules", href: "/schedules", roles: ["admin", "principal"] },
    ],
  },
  // Fee Head : Permission superadmin only
  {
    label: "Fee Head",
    icon: UserCheck,
    href: "/fee-head",
    roles: ["superadmin"],
    exactMatch: true,
  },
  // Fee Management : Permission admin and principal
  {
    label: "Fee Management",
    icon: HandCoins,
    href: "/fee-management",
    roles: ["admin", "principal"],
    exactMatch: true,
  },
  {
    label: "Enrollments",
    icon: Users,
    roles: ["admin", "principal", "superadmin"],
    children: [
      { label: "Student Enrollment", href: "/student-enrollment", roles:["admin", "principal"] },
      { label: "Staff Enrollment", href: "/staff-enrollment", roles:["admin", "principal"] },
      { label: "Teacher Positions", href: "/position-levels", roles: ["superadmin"] },
    ],
  },
  {
    label: "Subjects",
    icon: BookOpen,
    href: "/subjects",
    roles: ["superadmin"],
    exactMatch: true,
  },

  // Roles & Permissions: superadmin only
  // {
  //   label: "Roles & Permissions",
  //   icon: UserCheck2,
  //   roles: ["superadmin"],
  //   children: [
  //     { label: "Roles", href: "/roles", roles: ["superadmin"] },
  //     { label: "Add Role", href: "/roles/add", roles: ["superadmin"] },
  //     { label: "Manage Permissions", href: "/roles/permissions", roles: ["superadmin"] },
  //   ],
  // },

  // Students: broader permissions
  // {
  //   label: "Students",
  //   icon: Users,
  //   roles: ["superadmin", "admin", "principal", "coordinator"],
  //   children: [
  //     { label: "All Students", href: "/students" },
  //     { label: "Admissions", href: "/students/admissions", roles: ["superadmin", "admin"]},
  //     { label: "Enrollments", href: "/students/enrollments", roles: ["superadmin", "admin"] },
  //   ],
  // },

  // Courses: broader permissions  
  // {
  //   label: "Courses",
  //   icon: GraduationCap,
  //   roles: ["superadmin", "admin", "principal", "teacher", "coordinator"],
  //   children: [
  //     { label: "All Courses", href: "/courses" },
  //     { label: "Course Management", href: "/courses/manage", roles: ["superadmin", "admin", "principal"] },
  //     { label: "Assignments", href: "/courses/assignments", roles: ["superadmin", "admin", "teacher"] },
  //   ],
  // },

  // Faculty: broader permissions
  // {
  //   label: "Faculty",
  //   icon: UserCheck,
  //   roles: ["superadmin", "admin", "principal", "coordinator"],
  //   children: [
  //     { label: "All Faculty", href: "/faculty" },
  //     { label: "Departments", href: "/faculty/departments" },
  //     { label: "Schedule", href: "/faculty/schedule" },
  //   ],
  // },

  // Library: broader permissions
  // {
  //   label: "Library",
  //   icon: BookOpen,
  //   href: "/library",
  //   roles: ["superadmin", "admin", "principal"],
  // },

  // Attendance: broader permissions
  // {
  //   label: "Attendance",
  //   icon: Calendar,
  //   href: "/attendance",
  //   roles: ["superadmin", "admin", "principal", "teacher", "coordinator"],
  // },

  // Reports: broader permissions
  // {
  //   label: "Reports",
  //   icon: BarChart3,
  //   roles: ["superadmin", "admin", "principal", "accountant"],
  //   children: [
  //     { label: "Student Reports", href: "/reports/students" },
  //     { label: "Academic Reports", href: "/reports/academic" },
  //     { label: "Financial Reports", href: "/reports/financial", roles: ["superadmin", "admin", "accountant"] },
  //   ],
  // },

  // Settings
  {
    label: "Settings",
    icon: Settings,
    // roles: ["superadmin", "admin"],
    href: "/settings",
    exactMatch: true,

    // children: [
    //   { label: "General", href: "/settings/general" },
    //   { label: "Security", href: "/settings/security" },
    //   { label: "Change Password", href: "/settings/change-password" },
    // ],
  },
];

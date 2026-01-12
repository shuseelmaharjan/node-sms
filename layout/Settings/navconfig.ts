import type { LucideIcon } from "lucide-react";
import { School, Users, Shield, SlidersHorizontal } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  exactMatch?: boolean;
};

export const settingsNavConfig: NavItem[] = [
  {
    label: "Schools",
    href: "/dashboard/settings/schools",
    icon: School,
    exactMatch: true,
  },
  {
    label: "Users",
    href: "/dashboard/settings/users",
    icon: Users,
  },
  {
    label: "Roles & Permissions",
    href: "/dashboard/settings/roles",
    icon: Shield,
  },
  {
    label: "General",
    href: "/dashboard/settings/general",
    icon: SlidersHorizontal,
  },
];

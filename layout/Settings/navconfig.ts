import type { LucideIcon } from "lucide-react";
import { School, Users, ShieldCheck , SlidersHorizontal, KeyRound } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  exactMatch?: boolean;
};

export const settingsNavConfig: NavItem[] = [
  {
    label: "General",
    href: "/dashboard/settings/general",
    icon: SlidersHorizontal,
  },
  {
    label: "Security",
    href: "/dashboard/settings/security",
    icon: ShieldCheck,
    exactMatch: true,
  },
  {
    label: "Change Password",
    href: "/dashboard/settings/change-password",
    icon: KeyRound,
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
    icon: ShieldCheck,
  },
  
];

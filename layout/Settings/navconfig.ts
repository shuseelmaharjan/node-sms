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
    href: "/settings/general",
    icon: SlidersHorizontal,
  },
  {
    label: "Security",
    href: "/settings/security",
    icon: ShieldCheck,
    exactMatch: true,
  },
  {
    label: "Change Password",
    href: "/settings/change-password",
    icon: KeyRound,
    exactMatch: true,
  },
  // {
  //   label: "Users",
  //   href: "/settings/users",
  //   icon: Users,
  // },
  // {
  //   label: "Roles & Permissions",
  //   href: "/settings/roles",
  //   icon: ShieldCheck,
  // },
  
];

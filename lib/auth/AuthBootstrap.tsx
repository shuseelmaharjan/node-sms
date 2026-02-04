"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { bootstrapSession } from "@/lib/auth/session";
import { PUBLIC_ROUTES, isRouteInList } from "@/config/routes";

export function AuthBootstrap() {
  const pathname = usePathname();

  useEffect(() => {
    if (isRouteInList(pathname, PUBLIC_ROUTES)) return;
    bootstrapSession();
  }, [pathname]);

  return null;
}

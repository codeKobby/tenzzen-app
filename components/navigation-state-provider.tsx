"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { setPreviousPath } from "@/lib/utils/navigation";

export function NavigationStateProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname.includes("/analysis")) {
      setPreviousPath(pathname);
    }
  }, [pathname]);

  return <>{children}</>;
}

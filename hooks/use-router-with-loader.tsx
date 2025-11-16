"use client";

import { useRouter as useNextRouter } from "next/navigation";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import NProgress from "nprogress";

/**
 * A custom router hook that integrates with the top loader
 */
export function useRouter() {
  const router = useNextRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  return {
    ...router,
    push: (href: string, options?: any) => {
      NProgress.start();
      router.push(href, options);
    },
    replace: (href: string, options?: any) => {
      NProgress.start();
      router.replace(href, options);
    },
    back: () => {
      NProgress.start();
      router.back();
    },
    forward: () => {
      NProgress.start();
      router.forward();
    },
    refresh: () => {
      NProgress.start();
      router.refresh();
    }
  };
}

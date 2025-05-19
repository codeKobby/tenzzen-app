"use client";

import { useRouter as useNextRouter } from "next/navigation";
import { useTopLoader } from "nextjs-toploader";

/**
 * A custom router hook that triggers the top loader on navigation
 * This ensures the loader appears for programmatic navigation with router.push/replace
 */
export function useRouter() {
  const router = useNextRouter();
  const loader = useTopLoader();

  return {
    ...router,
    push: (href: string, options?: any) => {
      loader.start();
      router.push(href, options);
    },
    replace: (href: string, options?: any) => {
      loader.start();
      router.replace(href, options);
    },
    back: () => {
      loader.start();
      router.back();
    },
    forward: () => {
      loader.start();
      router.forward();
    },
    refresh: () => {
      loader.start();
      router.refresh();
    }
  };
}

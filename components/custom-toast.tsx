'use client';

import { Toaster, toast as sonnerToast } from "sonner";
import { useTheme } from "next-themes";

// Custom toast wrapper that uses Sonner toast
export const toast = {
  success: (title: string, options?: { description?: string }) => {
    sonnerToast.success(title, {
      description: options?.description,
      duration: 4000,
    });
  },
  error: (title: string, options?: { description?: string }) => {
    sonnerToast.error(title, {
      description: options?.description,
      duration: 6000,
    });
  },
  info: (title: string, options?: { description?: string }) => {
    sonnerToast.info(title, {
      description: options?.description,
      duration: 4000,
    });
  },
  warning: (title: string, options?: { description?: string }) => {
    sonnerToast.warning(title, {
      description: options?.description,
      duration: 5000,
    });
  },
};

// Toast container component that was missing
export function ToastContainer() {
  const { theme } = useTheme();

  return (
    <Toaster
      theme={theme as "light" | "dark" | "system"}
      closeButton
      richColors
      className="z-[100]"
      toastOptions={{
        style: {
          borderRadius: '0.5rem',
          maxWidth: '420px',
        }
      }}
    />
  );
}

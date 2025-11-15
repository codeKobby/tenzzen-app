import { toast } from '@/components/custom-toast';

// A safe wrapper for toast operations to prevent React render errors
class ToastManager {
  // Public methods that mirror our custom toast API
  success(message: string, options?: any) {
    const description = options?.description;
    const duration = options?.duration || 5000;
    return toast.success(message, description, duration);
  }
  
  error(message: string, options?: any) {
    const description = options?.description;
    const duration = options?.duration || 5000;
    return toast.error(message, description, duration);
  }
  
  info(message: string, options?: any) {
    const description = options?.description;
    const duration = options?.duration || 5000;
    return toast.info(message, description, duration);
  }
  
  warning(message: string, options?: any) {
    const description = options?.description;
    const duration = options?.duration || 5000;
    return toast.warning(message, description, duration);
  }
  
  dismiss(toastId?: string) {
    toast.dismiss(toastId);
  }
}

export const safeToast = new ToastManager();

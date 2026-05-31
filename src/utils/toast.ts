import { toast, type ExternalToast } from "sonner";

type ToastOptions = ExternalToast;

export const toastUtil = {
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, options);
  },

  error: (message: string, options?: ToastOptions) => {
    toast.error(message, options);
  },

  info: (message: string, options?: ToastOptions) => {
    toast.info(message, options);
  },

  warning: (message: string, options?: ToastOptions) => {
    toast.warning(message, options);
  },

  dismiss: (id?: string | number) => {
    toast.dismiss(id);
  },
};

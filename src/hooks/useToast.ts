import { useContext } from "react";
import { ToastContext } from "../components/ToastProvider";
import type { ToastVariant } from "../types";

export interface ToastInput {
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
}

export const useToast = () => {
  const ctx = useContext(ToastContext);

  if (!ctx) {
    // Safe fallback so components mounted outside the provider don't crash
    return {
      toast: (_input: ToastInput) => {
        // no-op
      },
      dismiss: (_id: string) => {
        // no-op
      },
      clear: () => {
        // no-op
      }
    };
  }

  return {
    toast: ctx.toast,
    dismiss: ctx.dismiss,
    clear: ctx.clear
  };
};

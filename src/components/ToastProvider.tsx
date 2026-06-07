import React from "react";
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import type { Toast, ToastVariant } from "../types";

interface ToastContextValue {
  toast: (input: Omit<Toast, "id" | "createdAt" | "duration"> & { duration?: number }) => void;
  dismiss: (id: string) => void;
  clear: () => void;
  toasts: Toast[];
}

export const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 5000;

const variantStyles: Record<ToastVariant, { bg: string; border: string; text: string; icon: React.ReactNode; iconWrap: string }> = {
  success: {
    bg: "bg-emerald-600/95 dark:bg-emerald-600/95",
    border: "border-emerald-400/40",
    text: "text-white",
    icon: <CheckCircle2 className="w-5 h-5" />,
    iconWrap: "bg-white/15 text-white"
  },
  error: {
    bg: "bg-rose-600/95 dark:bg-rose-600/95",
    border: "border-rose-400/40",
    text: "text-white",
    icon: <XCircle className="w-5 h-5" />,
    iconWrap: "bg-white/15 text-white"
  },
  warning: {
    bg: "bg-amber-500/95 dark:bg-amber-500/95",
    border: "border-amber-300/40",
    text: "text-white",
    icon: <AlertTriangle className="w-5 h-5" />,
    iconWrap: "bg-white/15 text-white"
  },
  info: {
    bg: "bg-slate-700/95 dark:bg-slate-700/95",
    border: "border-slate-400/30",
    text: "text-white",
    icon: <Info className="w-5 h-5" />,
    iconWrap: "bg-white/15 text-white"
  }
};

const ToastCard: React.FC<{ toast: Toast; onDismiss: (id: string) => void; isExiting: boolean }> = ({
  toast,
  onDismiss,
  isExiting
}) => {
  const cfg = variantStyles[toast.variant];
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto relative overflow-hidden w-[340px] rounded-xl border shadow-2xl backdrop-blur-sm ${cfg.bg} ${cfg.border} ${
        isExiting ? "toast-out" : "toast-in"
      }`}
    >
      <div className="flex items-start gap-3 p-3.5">
        <div className={`shrink-0 p-1.5 rounded-md ${cfg.iconWrap}`}>{cfg.icon}</div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-extrabold leading-snug ${cfg.text}`}>{toast.title}</p>
          {toast.description && (
            <p className={`text-[11px] mt-1 leading-snug ${cfg.text} opacity-90`}>
              {toast.description}
            </p>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className={`shrink-0 p-1 rounded hover:bg-white/10 transition-colors cursor-pointer ${cfg.text} opacity-80 hover:opacity-100`}
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="absolute left-0 bottom-0 h-0.5 bg-white/60 progress-bar-tick" />
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [exiting, setExiting] = useState<Record<string, boolean>>({});
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setExiting(prev => ({ ...prev, [id]: true }));
    window.setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      setExiting(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 250);
    const t = timersRef.current[id];
    if (t) {
      clearTimeout(t);
      delete timersRef.current[id];
    }
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>((input) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const duration = input.duration ?? DEFAULT_DURATION;
    const next: Toast = {
      id,
      variant: input.variant,
      title: input.title,
      description: input.description,
      createdAt: Date.now(),
      duration
    };

    setToasts(prev => {
      const updated = [...prev, next];
      // Max 3 toasts visible at once — dismiss oldest first
      if (updated.length > MAX_VISIBLE) {
        const overflow = updated.slice(0, updated.length - MAX_VISIBLE);
        overflow.forEach(t => {
          // schedule dismissal for the overflowed ones
          window.setTimeout(() => dismiss(t.id), 0);
        });
        return updated.slice(-MAX_VISIBLE);
      }
      return updated;
    });

    timersRef.current[id] = setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const clear = useCallback(() => {
    Object.values(timersRef.current).forEach(clearTimeout);
    timersRef.current = {};
    setToasts([]);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ toast, dismiss, clear, toasts }), [toast, dismiss, clear, toasts]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map(t => (
          <ToastCard key={t.id} toast={t} onDismiss={dismiss} isExiting={!!exiting[t.id]} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastVariant = "default" | "error" | "success";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  closing: boolean;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_LIFETIME_MS = 4000;
const TOAST_FADEOUT_MS = 160;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, closing: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_FADEOUT_MS);
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "default") => {
      idRef.current += 1;
      const id = idRef.current;
      setToasts((prev) => [...prev, { id, message, variant, closing: false }]);
      setTimeout(() => dismiss(id), TOAST_LIFETIME_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastRegion toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastRegion({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const accent =
    toast.variant === "error"
      ? "border-incorrect/30 text-incorrect"
      : toast.variant === "success"
        ? "border-correct/30 text-correct"
        : "border-gold/30 text-cream";

  return (
    <div
      role={toast.variant === "error" ? "alert" : "status"}
      className={`pointer-events-auto min-w-[240px] max-w-sm bg-surface rounded-xl shadow-lg border ${accent} ${
        toast.closing ? "toast-out" : "toast-in"
      }`}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <span className="text-sm font-medium text-cream flex-1">{toast.message}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="text-cream-muted hover:text-cream text-xs font-bold leading-none -mr-1 mt-0.5"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

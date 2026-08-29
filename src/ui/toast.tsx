"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

/** The only toasts (blueprint 3.32). */
export type ToastMessage = "Copied" | "Request sent" | "Saved" | "Removed";

const ToastContext = createContext<(message: ToastMessage) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: ToastMessage } | null>(null);
  const timer = useRef<number | null>(null);
  const seq = useRef(0);

  const show = useCallback((message: ToastMessage) => {
    seq.current += 1;
    setToast({ id: seq.current, message });
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        <div key={toast.id} className="toast t-body" role="status" onClick={() => setToast(null)}>
          {toast.message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

/** `const toast = useToast(); toast("Copied")`. A no-op outside a provider. */
export function useToast(): (message: ToastMessage) => void {
  return useContext(ToastContext);
}

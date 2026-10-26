"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

// Short confirmation messages ("Saved", "Report sent") shown above the nav.

type ToastCtx = (message: string) => void;

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback((m: string) => {
    clearTimeout(timer.current);
    setMessage(m);
    timer.current = setTimeout(() => setMessage(null), 2400);
  }, []);

  return (
    <Ctx.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-28 z-[60] flex justify-center px-4">
        {message && (
          <p className="rounded-full bg-fg px-4 py-2.5 text-[14px] font-medium text-bg shadow-2xl">{message}</p>
        )}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

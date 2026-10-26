"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Client-side shortlist. Swap for an API-backed store once accounts exist.

type SavedCtx = {
  saved: Set<string>;
  toggle: (id: string) => void;
  isSaved: (id: string) => boolean;
  clear: () => void;
};

const Ctx = createContext<SavedCtx | null>(null);
const KEY = "saved-profiles";

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSaved(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  const toggle = useCallback((id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSaved(new Set());
    try {
      localStorage.removeItem(KEY);
    } catch {}
  }, []);

  const isSaved = useCallback((id: string) => saved.has(id), [saved]);

  return <Ctx.Provider value={{ saved, toggle, isSaved, clear }}>{children}</Ctx.Provider>;
}

export function useSaved() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSaved must be used inside SavedProvider");
  return ctx;
}

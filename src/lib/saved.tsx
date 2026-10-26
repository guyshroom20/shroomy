"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { addToShortlist, fetchShortlist, removeFromShortlist } from "@/lib/data/shortlist";

// Shortlist. Kept in the browser while signed out; once signed in it lives in
// the account (and anything saved before signing in is carried over).

type SavedCtx = {
  saved: Set<string>;
  toggle: (id: string) => void;
  isSaved: (id: string) => boolean;
  clear: () => void;
};

const Ctx = createContext<SavedCtx | null>(null);
const KEY = "saved-profiles";

function readLocal(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeLocal(ids: Iterable<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch {}
}

export function SavedProvider({ signedIn = false, children }: { signedIn?: boolean; children: React.ReactNode }) {
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    const local = readLocal();
    if (!signedIn) {
      setSaved(new Set(local));
      return;
    }
    let cancelled = false;
    (async () => {
      const remote = await fetchShortlist();
      const toUpload = local.filter((id) => !remote.includes(id));
      await Promise.allSettled(toUpload.map(addToShortlist));
      try {
        localStorage.removeItem(KEY);
      } catch {}
      if (!cancelled) setSaved(new Set([...remote, ...toUpload]));
    })().catch(() => !cancelled && setSaved(new Set(local)));
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  const toggle = useCallback(
    (id: string) => {
      setSaved((prev) => {
        const next = new Set(prev);
        const adding = !next.has(id);
        if (adding) next.add(id);
        else next.delete(id);
        if (signedIn) {
          (adding ? addToShortlist(id) : removeFromShortlist(id)).catch(() =>
            setSaved((cur) => {
              const undo = new Set(cur);
              if (adding) undo.delete(id);
              else undo.add(id);
              return undo;
            }),
          );
        } else {
          writeLocal(next);
        }
        return next;
      });
    },
    [signedIn],
  );

  const clear = useCallback(() => {
    setSaved((prev) => {
      if (signedIn) prev.forEach((id) => void removeFromShortlist(id).catch(() => {}));
      else writeLocal([]);
      return new Set();
    });
  }, [signedIn]);

  const isSaved = useCallback((id: string) => saved.has(id), [saved]);

  return <Ctx.Provider value={{ saved, toggle, isSaved, clear }}>{children}</Ctx.Provider>;
}

export function useSaved() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSaved must be used inside SavedProvider");
  return ctx;
}

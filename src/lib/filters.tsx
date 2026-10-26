"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Profile } from "./types";

// Discovery filters shared by For You, Nearby and Explore. Client-side until
// search moves to the API.

export type AgeBand = "any" | "18-24" | "25-29" | "30+";

export type Filters = {
  age: AgeBand;
  verifiedOnly: boolean;
  availableNow: boolean;
  /** Maximum distance in miles, or null for any distance. */
  maxMiles: number | null;
};

export const defaultFilters: Filters = { age: "any", verifiedOnly: false, availableNow: false, maxMiles: null };

export const ageBands: { id: AgeBand; label: string }[] = [
  { id: "any", label: "Any age" },
  { id: "18-24", label: "18–24" },
  { id: "25-29", label: "25–29" },
  { id: "30+", label: "30+" },
];

export const distanceOptions: { value: number | null; label: string }[] = [
  { value: 1, label: "1 mi" },
  { value: 3, label: "3 mi" },
  { value: 5, label: "5 mi" },
  { value: null, label: "Any" },
];

const inBand = (age: number, band: AgeBand) =>
  band === "any" ||
  (band === "18-24" && age <= 24) ||
  (band === "25-29" && age >= 25 && age <= 29) ||
  (band === "30+" && age >= 30);

export const applyFilters = (profiles: Profile[], f: Filters) =>
  profiles.filter(
    (p) =>
      inBand(p.age, f.age) &&
      (!f.verifiedOnly || p.verified) &&
      (!f.availableNow || p.availability === "available") &&
      (f.maxMiles === null || p.distanceMiles <= f.maxMiles),
  );

/** Active filters as removable chips. Each chip's `clear` resets just that filter. */
export function activeChips(f: Filters): { id: keyof Filters; label: string; clear: Partial<Filters> }[] {
  const chips: { id: keyof Filters; label: string; clear: Partial<Filters> }[] = [];
  if (f.age !== "any") chips.push({ id: "age", label: ageBands.find((b) => b.id === f.age)!.label, clear: { age: "any" } });
  if (f.verifiedOnly) chips.push({ id: "verifiedOnly", label: "ID verified", clear: { verifiedOnly: false } });
  if (f.availableNow) chips.push({ id: "availableNow", label: "Available now", clear: { availableNow: false } });
  if (f.maxMiles !== null) chips.push({ id: "maxMiles", label: `Within ${f.maxMiles} mi`, clear: { maxMiles: null } });
  return chips;
}

type FiltersCtx = { filters: Filters; update: (patch: Partial<Filters>) => void; reset: () => void };

const Ctx = createContext<FiltersCtx | null>(null);
const KEY = "discovery-filters";

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setFilters({ ...defaultFilters, ...JSON.parse(raw) });
    } catch {}
  }, []);

  const save = useCallback((next: Filters) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    return next;
  }, []);

  const update = useCallback((patch: Partial<Filters>) => setFilters((f) => save({ ...f, ...patch })), [save]);
  const reset = useCallback(() => setFilters(save(defaultFilters)), [save]);

  const value = useMemo(() => ({ filters, update, reset }), [filters, update, reset]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFilters() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFilters must be used inside FiltersProvider");
  return ctx;
}

/** Profiles that pass the current filters. */
export function useFilteredProfiles(profiles: Profile[]) {
  const { filters } = useFilters();
  return useMemo(() => applyFilters(profiles, filters), [profiles, filters]);
}

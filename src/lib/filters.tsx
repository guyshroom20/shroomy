"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Availability, Profile } from "./types";

// Discovery search and filters shared by For You, Nearby and Explore, plus
// named saved searches. Client-side until search moves to the API.

export type SortKey = "recommended" | "nearest" | "newest" | "active";

export type Filters = {
  /** Free text matched against name, area, bio and tags. */
  query: string;
  minAge: number;
  /** AGE_MAX means no upper limit. */
  maxAge: number;
  /** Maximum distance in miles, or null for any distance. */
  maxMiles: number | null;
  /** Town or area names (the part before the first comma). Empty means any. */
  areas: string[];
  /** Tag labels. A profile must have all of them. */
  interests: string[];
  verifiedOnly: boolean;
  availableNow: boolean;
  hasPhotos: boolean;
  hasLocked: boolean;
  sort: SortKey;
};

export const AGE_MIN = 18;
export const AGE_MAX = 50;

export const defaultFilters: Filters = {
  query: "",
  minAge: AGE_MIN,
  maxAge: AGE_MAX,
  maxMiles: null,
  areas: [],
  interests: [],
  verifiedOnly: false,
  availableNow: false,
  hasPhotos: false,
  hasLocked: false,
  sort: "recommended",
};

export const distanceOptions: { value: number | null; label: string }[] = [
  { value: 1, label: "1 mi" },
  { value: 3, label: "3 mi" },
  { value: 5, label: "5 mi" },
  { value: null, label: "Any" },
];

export const sortOptions: { id: SortKey; label: string }[] = [
  { id: "recommended", label: "Recommended" },
  { id: "nearest", label: "Nearest" },
  { id: "newest", label: "Newest" },
  { id: "active", label: "Recently active" },
];

export const areaOf = (p: Profile) => p.area.split(",")[0].trim();

const hasRealPhoto = (p: Profile) => p.photos.some((ph) => ph.src);

const matchesQuery = (p: Profile, query: string) => {
  const haystack = [p.displayName, p.area, p.bio, ...p.tags.map((t) => t.label)].join(" ").toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
};

const availabilityRank: Record<Availability, number> = { available: 0, away: 1, offline: 2 };
const time = (iso?: string) => (iso ? Date.parse(iso) : 0);

const sorters: Record<SortKey, ((a: Profile, b: Profile) => number) | null> = {
  recommended: null,
  nearest: (a, b) => a.distanceMiles - b.distanceMiles,
  newest: (a, b) => time(b.createdAt) - time(a.createdAt),
  active: (a, b) =>
    availabilityRank[a.availability] - availabilityRank[b.availability] || time(b.lastActiveAt) - time(a.lastActiveAt),
};

export function applyFilters(profiles: Profile[], f: Filters) {
  const result = profiles.filter(
    (p) =>
      (!f.query.trim() || matchesQuery(p, f.query)) &&
      p.age >= f.minAge &&
      (f.maxAge >= AGE_MAX || p.age <= f.maxAge) &&
      (f.maxMiles === null || p.distanceMiles <= f.maxMiles) &&
      (f.areas.length === 0 || f.areas.includes(areaOf(p))) &&
      f.interests.every((i) => p.tags.some((t) => t.label === i)) &&
      (!f.verifiedOnly || p.verified) &&
      (!f.availableNow || p.availability === "available") &&
      (!f.hasPhotos || hasRealPhoto(p)) &&
      (!f.hasLocked || p.lockedCount > 0),
  );
  const sort = sorters[f.sort];
  return sort ? result.sort(sort) : result;
}

/** Areas and interests present in a list of profiles, most common first. */
export function filterOptions(profiles: Profile[]) {
  const count = (values: string[]) => {
    const n = new Map<string, number>();
    values.forEach((v) => n.set(v, (n.get(v) ?? 0) + 1));
    return [...n.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([v]) => v);
  };
  const emoji = new Map(profiles.flatMap((p) => p.tags.map((t) => [t.label, t.emoji] as const)));
  return {
    areas: count(profiles.map(areaOf).filter(Boolean)),
    interests: count(profiles.flatMap((p) => p.tags.map((t) => t.label))).map((label) => ({ label, emoji: emoji.get(label) ?? "" })),
  };
}

export const ageLabel = (f: Pick<Filters, "minAge" | "maxAge">) =>
  f.maxAge >= AGE_MAX ? `${f.minAge}+` : `${f.minAge}–${f.maxAge}`;

type Chip = { id: string; label: string; clear: Partial<Filters> };

/** Active filters as removable chips. Each chip's `clear` resets just that filter. */
export function activeChips(f: Filters): Chip[] {
  const chips: Chip[] = [];
  if (f.minAge !== AGE_MIN || f.maxAge !== AGE_MAX) chips.push({ id: "age", label: ageLabel(f), clear: { minAge: AGE_MIN, maxAge: AGE_MAX } });
  if (f.maxMiles !== null) chips.push({ id: "maxMiles", label: `Within ${f.maxMiles} mi`, clear: { maxMiles: null } });
  f.areas.forEach((a) => chips.push({ id: `area:${a}`, label: a, clear: { areas: f.areas.filter((x) => x !== a) } }));
  f.interests.forEach((i) => chips.push({ id: `tag:${i}`, label: i, clear: { interests: f.interests.filter((x) => x !== i) } }));
  if (f.verifiedOnly) chips.push({ id: "verifiedOnly", label: "ID verified", clear: { verifiedOnly: false } });
  if (f.availableNow) chips.push({ id: "availableNow", label: "Available now", clear: { availableNow: false } });
  if (f.hasPhotos) chips.push({ id: "hasPhotos", label: "Has photos", clear: { hasPhotos: false } });
  if (f.hasLocked) chips.push({ id: "hasLocked", label: "Has 18+ content", clear: { hasLocked: false } });
  if (f.sort !== "recommended")
    chips.push({ id: "sort", label: `Sort: ${sortOptions.find((s) => s.id === f.sort)!.label}`, clear: { sort: "recommended" } });
  return chips;
}

/** Filters plus the search text, as a count for badges. */
export const activeCount = (f: Filters) => activeChips(f).length + (f.query.trim() ? 1 : 0);

export type SavedSearch = { id: string; name: string; filters: Filters; createdAt: string };

type FiltersCtx = {
  filters: Filters;
  update: (patch: Partial<Filters>) => void;
  reset: () => void;
  savedSearches: SavedSearch[];
  saveSearch: (name: string) => void;
  applySearch: (id: string) => void;
  deleteSearch: (id: string) => void;
};

const Ctx = createContext<FiltersCtx | null>(null);
const KEY = "discovery-filters";
const SEARCHES_KEY = "saved-searches";

const read = <T,>(key: string): T | undefined => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    const stored = read<Partial<Filters>>(KEY);
    // Spread over the defaults so filters saved by older versions still load.
    if (stored) setFilters({ ...defaultFilters, ...stored });
    setSavedSearches(read<SavedSearch[]>(SEARCHES_KEY) ?? []);
  }, []);

  const set = useCallback((next: (f: Filters) => Filters) => {
    setFilters((f) => {
      const value = next(f);
      write(KEY, value);
      return value;
    });
  }, []);

  const update = useCallback((patch: Partial<Filters>) => set((f) => ({ ...f, ...patch })), [set]);
  const reset = useCallback(() => set(() => defaultFilters), [set]);

  const setSearches = useCallback((next: (s: SavedSearch[]) => SavedSearch[]) => {
    setSavedSearches((s) => {
      const value = next(s);
      write(SEARCHES_KEY, value);
      return value;
    });
  }, []);

  const saveSearch = useCallback(
    (name: string) =>
      setSearches((s) => [{ id: crypto.randomUUID(), name: name.trim(), filters, createdAt: new Date().toISOString() }, ...s]),
    [filters, setSearches],
  );
  const applySearch = useCallback(
    (id: string) => {
      const found = savedSearches.find((s) => s.id === id);
      if (found) set(() => ({ ...defaultFilters, ...found.filters }));
    },
    [savedSearches, set],
  );
  const deleteSearch = useCallback((id: string) => setSearches((s) => s.filter((x) => x.id !== id)), [setSearches]);

  const value = useMemo(
    () => ({ filters, update, reset, savedSearches, saveSearch, applySearch, deleteSearch }),
    [filters, update, reset, savedSearches, saveSearch, applySearch, deleteSearch],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFilters() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFilters must be used inside FiltersProvider");
  return ctx;
}

/** Profiles that pass the current filters, in the chosen order. */
export function useFilteredProfiles(profiles: Profile[]) {
  const { filters } = useFilters();
  return useMemo(() => applyFilters(profiles, filters), [profiles, filters]);
}

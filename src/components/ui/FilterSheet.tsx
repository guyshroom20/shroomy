"use client";

import { Bookmark, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { Profile } from "@/lib/types";
import {
  AGE_MAX,
  AGE_MIN,
  ageLabel,
  applyFilters,
  distanceOptions,
  filterOptions,
  sortOptions,
  useFilters,
} from "@/lib/filters";
import { useToast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { Sheet } from "./Sheet";

type Props = { open: boolean; onClose: () => void; profiles: Profile[] };

const option = (active: boolean) =>
  cn("rounded-full px-4 py-2.5 text-[14px] transition", active ? "bg-fg text-bg" : "bg-surface-2 text-fg hover:bg-surface-3");

const heading = "mt-6 text-[13px] uppercase tracking-wide text-fg-subtle first:mt-0";

/** Shows a few options with a "Show all" toggle once a list gets long. */
const PREVIEW = 8;

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 py-3">
      <span>
        <span className="block text-[16px]">{label}</span>
        <span className="block text-[13px] text-fg-muted">{hint}</span>
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition peer-focus-visible:ring-2 peer-focus-visible:ring-accent",
          checked ? "bg-accent" : "bg-surface-3",
        )}
      >
        <span className={cn("absolute top-1 size-5 rounded-full bg-white transition-all", checked ? "left-6" : "left-1")} />
      </span>
    </label>
  );
}

/** Search, filters and saved searches. Changes apply immediately; the button just closes. */
export function FilterSheet({ open, onClose, profiles }: Props) {
  const { filters, update, reset, savedSearches, saveSearch, applySearch, deleteSearch } = useFilters();
  const [showAllTags, setShowAllTags] = useState(false);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const toast = useToast();
  const options = useMemo(() => filterOptions(profiles), [profiles]);
  const resultCount = useMemo(() => applyFilters(profiles, filters).length, [profiles, filters]);

  const toggleIn = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  const tags = showAllTags ? options.interests : options.interests.slice(0, PREVIEW);

  const submitName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    saveSearch(name);
    toast(`Saved search “${name.trim()}”`);
    setName("");
    setNaming(false);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Search & filters">
      {savedSearches.length > 0 && (
        <>
          <h3 className={heading}>Saved searches</h3>
          <ul className="mt-2 space-y-2">
            {savedSearches.map((s) => (
              <li key={s.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    applySearch(s.id);
                    toast(`Applied “${s.name}”`);
                  }}
                  className="flex flex-1 items-center gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-left text-[15px] hover:bg-surface-3"
                >
                  <Bookmark className="size-4 text-accent" fill="currentColor" /> {s.name}
                </button>
                <button
                  type="button"
                  aria-label={`Delete saved search ${s.name}`}
                  onClick={() => deleteSearch(s.id)}
                  className="flex size-11 items-center justify-center rounded-full bg-surface-2 text-fg-muted hover:text-fg"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <label className={heading} htmlFor="filter-query">
        Search
      </label>
      <input
        id="filter-query"
        type="search"
        value={filters.query}
        onChange={(e) => update({ query: e.target.value })}
        placeholder="Name, area, bio or interest"
        className="mt-2 w-full rounded-2xl bg-surface-2 px-4 py-3 text-[15px] placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent"
      />

      <h3 className={heading}>Sort by</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {sortOptions.map((s) => (
          <button key={s.id} type="button" aria-pressed={filters.sort === s.id} onClick={() => update({ sort: s.id })} className={option(filters.sort === s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      <h3 className={heading}>
        Age <span className="normal-case tracking-normal text-fg">{ageLabel(filters)}</span>
      </h3>
      <div className="mt-2 space-y-1">
        <label className="flex items-center gap-3 text-[13px] text-fg-muted">
          <span className="w-8">Min</span>
          <input
            type="range"
            min={AGE_MIN}
            max={AGE_MAX}
            value={filters.minAge}
            onChange={(e) => {
              const v = Number(e.target.value);
              update({ minAge: v, maxAge: Math.max(v, filters.maxAge) });
            }}
            className="flex-1 accent-[var(--accent)]"
            aria-label="Minimum age"
          />
        </label>
        <label className="flex items-center gap-3 text-[13px] text-fg-muted">
          <span className="w-8">Max</span>
          <input
            type="range"
            min={AGE_MIN}
            max={AGE_MAX}
            value={filters.maxAge}
            onChange={(e) => {
              const v = Number(e.target.value);
              update({ maxAge: v, minAge: Math.min(v, filters.minAge) });
            }}
            className="flex-1 accent-[var(--accent)]"
            aria-label="Maximum age"
          />
        </label>
      </div>

      <h3 className={heading}>Distance</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {distanceOptions.map((d) => (
          <button key={d.label} type="button" aria-pressed={filters.maxMiles === d.value} onClick={() => update({ maxMiles: d.value })} className={option(filters.maxMiles === d.value)}>
            {d.label}
          </button>
        ))}
      </div>

      {options.areas.length > 0 && (
        <>
          <h3 className={heading}>Area</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {options.areas.map((a) => (
              <button key={a} type="button" aria-pressed={filters.areas.includes(a)} onClick={() => update({ areas: toggleIn(filters.areas, a) })} className={option(filters.areas.includes(a))}>
                {a}
              </button>
            ))}
          </div>
        </>
      )}

      {options.interests.length > 0 && (
        <>
          <h3 className={heading}>Interests</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((t) => (
              <button
                key={t.label}
                type="button"
                aria-pressed={filters.interests.includes(t.label)}
                onClick={() => update({ interests: toggleIn(filters.interests, t.label) })}
                className={option(filters.interests.includes(t.label))}
              >
                {t.emoji && <span aria-hidden>{t.emoji} </span>}
                {t.label}
              </button>
            ))}
            {options.interests.length > PREVIEW && (
              <button type="button" onClick={() => setShowAllTags((v) => !v)} className="px-2 text-[14px] text-fg-muted underline underline-offset-4">
                {showAllTags ? "Show fewer" : `Show all ${options.interests.length}`}
              </button>
            )}
          </div>
        </>
      )}

      <div className="mt-4 divide-y divide-line">
        <Toggle label="Available now" hint="Hide away and offline profiles" checked={filters.availableNow} onChange={(v) => update({ availableNow: v })} />
        <Toggle label="ID verified only" hint="Profiles that passed ID checks" checked={filters.verifiedOnly} onChange={(v) => update({ verifiedOnly: v })} />
        <Toggle label="Has photos" hint="At least one real photo" checked={filters.hasPhotos} onChange={(v) => update({ hasPhotos: v })} />
        <Toggle label="Has 18+ content" hint="Profiles with locked photos" checked={filters.hasLocked} onChange={(v) => update({ hasLocked: v })} />
      </div>

      {naming ? (
        <form onSubmit={submitName} className="mt-5 flex gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="Name this search"
            aria-label="Saved search name"
            className="min-w-0 flex-1 rounded-full bg-surface-2 px-4 text-[15px] placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button type="submit" disabled={!name.trim()} className="h-12 rounded-full bg-accent px-5 text-[15px] font-medium text-accent-fg disabled:opacity-40">
            Save
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setNaming(true)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-line py-3 text-[15px] text-fg"
        >
          <Bookmark className="size-4" /> Save this search
        </button>
      )}

      <div className="mt-3 flex gap-2">
        <button type="button" onClick={reset} className="h-14 rounded-full bg-surface-2 px-6 text-[16px]">
          Reset
        </button>
        <button type="button" onClick={onClose} className="h-14 flex-1 rounded-full bg-fg text-[16px] font-medium text-bg">
          Show {resultCount} {resultCount === 1 ? "profile" : "profiles"}
        </button>
      </div>
    </Sheet>
  );
}

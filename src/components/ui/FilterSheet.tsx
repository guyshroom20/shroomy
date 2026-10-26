"use client";

import { ageBands, distanceOptions, useFilters } from "@/lib/filters";
import { cn } from "@/lib/cn";
import { Sheet } from "./Sheet";

type Props = { open: boolean; onClose: () => void; resultCount: number };

const option = (active: boolean) =>
  cn("rounded-full px-4 py-2.5 text-[14px] transition", active ? "bg-fg text-bg" : "bg-surface-2 text-fg hover:bg-surface-3");

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

/** Discovery filters. Changes apply immediately; the button just closes. */
export function FilterSheet({ open, onClose, resultCount }: Props) {
  const { filters, update, reset } = useFilters();
  return (
    <Sheet open={open} onClose={onClose} title="Filters">
      <h3 className="text-[13px] uppercase tracking-wide text-fg-subtle">Age</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {ageBands.map((b) => (
          <button key={b.id} type="button" aria-pressed={filters.age === b.id} onClick={() => update({ age: b.id })} className={option(filters.age === b.id)}>
            {b.label}
          </button>
        ))}
      </div>

      <h3 className="mt-6 text-[13px] uppercase tracking-wide text-fg-subtle">Distance</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {distanceOptions.map((d) => (
          <button key={d.label} type="button" aria-pressed={filters.maxMiles === d.value} onClick={() => update({ maxMiles: d.value })} className={option(filters.maxMiles === d.value)}>
            {d.label}
          </button>
        ))}
      </div>

      <div className="mt-4 divide-y divide-line">
        <Toggle label="ID verified only" hint="Profiles that passed ID checks" checked={filters.verifiedOnly} onChange={(v) => update({ verifiedOnly: v })} />
        <Toggle label="Available now" hint="Hide away and offline profiles" checked={filters.availableNow} onChange={(v) => update({ availableNow: v })} />
      </div>

      <div className="mt-6 flex gap-2">
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

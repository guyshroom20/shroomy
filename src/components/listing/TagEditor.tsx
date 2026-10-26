"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import type { Tag } from "@/lib/types";
import { LIMITS } from "@/lib/my-listing";

type Props = { tags: Tag[]; onChange: (tags: Tag[]) => void; suggestions: Tag[]; error?: string };

// The backend form defaults new tags to ✨ (src/app/advertise/actions.ts).
const DEFAULT_EMOJI = "✨";

export function TagEditor({ tags, onChange, suggestions, error }: Props) {
  const [emoji, setEmoji] = useState("");
  const [label, setLabel] = useState("");
  const full = tags.length >= LIMITS.tags;
  const has = (l: string) => tags.some((t) => t.label.toLowerCase() === l.toLowerCase());

  const add = (tag: Tag) => {
    const clean = { emoji: tag.emoji.trim() || DEFAULT_EMOJI, label: tag.label.trim().slice(0, LIMITS.tagLabel) };
    if (!clean.label || has(clean.label) || full) return;
    onChange([...tags, clean]);
  };

  const submit = () => {
    add({ emoji, label });
    setEmoji("");
    setLabel("");
  };

  const unused = suggestions.filter((s) => !has(s.label)).slice(0, 10);

  return (
    <div>
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <li key={t.label} className="inline-flex items-center gap-2 rounded-full bg-surface-2 py-2 pl-3.5 pr-2 text-[14px]">
              <span aria-hidden>{t.emoji}</span>
              {t.label}
              <button
                type="button"
                aria-label={`Remove ${t.label}`}
                onClick={() => onChange(tags.filter((x) => x.label !== t.label))}
                className="flex size-6 items-center justify-center rounded-full text-fg-muted hover:bg-surface-3 hover:text-fg"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={emoji}
          onChange={(e) => setEmoji([...e.target.value].slice(-2).join(""))}
          placeholder={DEFAULT_EMOJI}
          aria-label="Tag emoji"
          disabled={full}
          className="w-14 rounded-2xl bg-surface px-3 py-3.5 text-center text-[18px] outline-none ring-1 ring-line focus:ring-fg-muted"
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          maxLength={LIMITS.tagLabel}
          placeholder={full ? `${LIMITS.tags} tags max` : "Add a tag, e.g. Movie buff"}
          aria-label="Tag label"
          disabled={full}
          className="min-w-0 flex-1 rounded-2xl bg-surface px-4 py-3.5 text-[16px] outline-none ring-1 ring-line placeholder:text-fg-subtle focus:ring-fg-muted"
        />
        <button
          type="button"
          onClick={submit}
          disabled={full || !label.trim()}
          aria-label="Add tag"
          className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-fg text-bg disabled:opacity-40"
        >
          <Plus className="size-5" />
        </button>
      </div>

      {!full && unused.length > 0 && (
        <div className="mt-3">
          <p className="text-[13px] text-fg-subtle">Popular on shroom</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {unused.map((s) => (
              <button key={s.label} type="button" onClick={() => add(s)} className="rounded-full border border-line px-3 py-1.5 text-[13px] text-fg-muted hover:text-fg">
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <p className={error ? "mt-3 text-[13px] text-like" : "mt-3 text-[13px] text-fg-subtle"} role={error ? "alert" : undefined}>
        {error ?? `${tags.length}/${LIMITS.tags} tags`}
      </p>
    </div>
  );
}

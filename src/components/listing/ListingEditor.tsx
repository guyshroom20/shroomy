"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { filterOptions } from "@/lib/filters";
import {
  LIMITS,
  MY_LISTING_ID,
  emptyListing,
  useMyListing,
  validateListing,
  type ListingErrors,
  type MyListing,
  type StoryDraft,
} from "@/lib/my-listing";
import { useProfiles } from "@/lib/profiles";
import { useToast } from "@/lib/toast";
import type { Availability } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Sheet } from "@/components/ui/Sheet";
import { Field, FormError, Section, TextArea } from "./fields";
import { PhotoEditor } from "./PhotoEditor";
import { StoryEditor } from "./StoryEditor";
import { TagEditor } from "./TagEditor";

const availabilityOptions: { id: Availability; label: string }[] = [
  { id: "available", label: "Available now" },
  { id: "away", label: "Away" },
  { id: "offline", label: "Offline" },
];

const emptyStory: StoryDraft = { caption: "", now_playing: "", slides: [] };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

/** Where each error lives, in page order, so Save can scroll to the first one. */
const errorSections: [keyof ListingErrors, string][] = [
  ["display_name", "details"],
  ["slug", "details"],
  ["age", "details"],
  ["area", "details"],
  ["bio", "details"],
  ["tags", "tags"],
  ["photos", "photos"],
  ["story", "story"],
];

export function ListingEditor() {
  const { listing, save, remove } = useMyListing();
  const router = useRouter();
  const toast = useToast();
  const others = useProfiles();

  const initial = useMemo(() => listing ?? emptyListing(), [listing]);
  const [draft, setDraft] = useState<MyListing>(initial);
  const [ageText, setAgeText] = useState(listing ? String(listing.age) : "");
  const [story, setStory] = useState<StoryDraft>(listing?.story ?? emptyStory);
  const [slugTouched, setSlugTouched] = useState(Boolean(listing?.slug));
  const [showErrors, setShowErrors] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const hasStory = story.slides.length > 0 || story.caption.trim() !== "";
  const candidate: MyListing = { ...draft, age: ageText.trim() ? Number(ageText) : NaN, story: hasStory ? story : undefined };
  const errors = validateListing(candidate);
  const errorCount = Object.keys(errors).length;
  const shown = showErrors ? errors : {};
  const dirty = JSON.stringify(candidate) !== JSON.stringify({ ...initial, age: listing ? initial.age : NaN });

  // Browser-level guard for reloads and closing the tab.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof MyListing>(key: K, value: MyListing[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const suggestions = useMemo(
    () => filterOptions(others.filter((p) => p.id !== MY_LISTING_ID)).interests.map(({ label, emoji }) => ({ label, emoji: emoji || "✨" })),
    [others],
  );

  const leave = () => router.push(listing ? "/me" : "/");
  const cancel = () => (dirty ? setConfirmLeave(true) : leave());

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);
    setSaveError(undefined);
    if (errorCount) {
      const first = errorSections.find(([k]) => errors[k]);
      document.getElementById(first?.[1] ?? "details")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    try {
      save({ ...candidate, display_name: candidate.display_name.trim(), area: candidate.area.trim(), bio: candidate.bio.trim() });
    } catch (err) {
      setSaveError((err as Error).message);
      return;
    }
    toast(listing ? "Listing saved" : "Listing created");
    router.push("/me");
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-1 flex-col">
      <header className="glass sticky top-0 z-20 flex items-center justify-between gap-3 px-4 pb-3 pt-4">
        <button type="button" onClick={cancel} aria-label="Cancel" className="flex size-12 items-center justify-center rounded-full bg-surface-2">
          <X className="size-5" />
        </button>
        <h1 className="text-[17px] font-medium">{listing ? "Edit listing" : "Create listing"}</h1>
        <button type="submit" className="h-12 rounded-full bg-accent px-5 text-[15px] font-medium text-accent-fg">
          Save
        </button>
      </header>

      <div className="px-5 pb-32">
        {showErrors && errorCount > 0 && (
          <div className="mt-4">
            <FormError message={`Fix ${errorCount === 1 ? "1 thing" : `${errorCount} things`} below before saving.`} />
          </div>
        )}
        {saveError && (
          <div className="mt-4">
            <FormError message={saveError} />
          </div>
        )}

        <Section id="details" title="Your details">
          <div className="space-y-4">
            <Field
              label="Display name"
              value={draft.display_name}
              onChange={(e) => {
                set("display_name", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
              maxLength={LIMITS.displayName}
              counter={`${draft.display_name.length}/${LIMITS.displayName}`}
              error={shown.display_name}
              autoComplete="off"
            />
            <Field
              label="Profile link"
              value={draft.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value.toLowerCase());
              }}
              hint={`shroom.uk/profile/${draft.slug || "your-name"}`}
              error={shown.slug}
              autoCapitalize="none"
              autoComplete="off"
            />
            <Field
              label="Age"
              type="number"
              inputMode="numeric"
              min={LIMITS.ageMin}
              max={LIMITS.ageMax}
              value={ageText}
              onChange={(e) => setAgeText(e.target.value)}
              hint="Must match your ID check. You must be 18 or over."
              error={shown.age}
            />
            <div>
              <span className="text-[13px] text-fg-muted">Availability</span>
              <div role="radiogroup" aria-label="Availability" className="mt-1.5 flex rounded-full bg-surface p-1 ring-1 ring-line">
                {availabilityOptions.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={draft.availability === o.id}
                    onClick={() => set("availability", o.id)}
                    className={cn(
                      "flex-1 rounded-full py-2.5 text-[14px] transition",
                      draft.availability === o.id ? "bg-fg text-bg" : "text-fg-muted hover:text-fg",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <Field
              label="Area shown on your listing"
              value={draft.area}
              onChange={(e) => set("area", e.target.value)}
              placeholder="Shoreditch, London"
              maxLength={LIMITS.areaMax}
              hint="Town or area only. Never your street, house number or postcode."
              error={shown.area}
            />
            <TextArea
              label="About you"
              value={draft.bio}
              onChange={(e) => set("bio", e.target.value)}
              rows={6}
              maxLength={LIMITS.bio}
              counter={`${draft.bio.length}/${LIMITS.bio}`}
              placeholder="What should people know about you?"
              error={shown.bio}
            />
          </div>
        </Section>

        <Section id="tags" title="Tags">
          <TagEditor tags={draft.tags} onChange={(tags) => set("tags", tags)} suggestions={suggestions} error={shown.tags} />
        </Section>

        <Section id="photos" title="Photos">
          <PhotoEditor photos={draft.photos} onChange={(photos) => set("photos", photos)} error={shown.photos} />
        </Section>

        <Section id="story" title="Story">
          <StoryEditor story={story} onChange={setStory} error={shown.story} />
        </Section>

        <button type="submit" className="mt-10 w-full rounded-full bg-accent py-4 text-[16px] font-medium text-accent-fg active:scale-[0.98]">
          {listing ? "Save changes" : "Create listing"}
        </button>
        {listing && (
          <button type="button" onClick={() => setConfirmDelete(true)} className="mt-3 w-full rounded-full py-3 text-[15px] text-like">
            Delete listing
          </button>
        )}
      </div>

      <Sheet open={confirmLeave} onClose={() => setConfirmLeave(false)} title="Discard changes?">
        <p className="text-[15px] text-fg-muted">You have unsaved changes. If you leave now, they&apos;ll be lost.</p>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={() => setConfirmLeave(false)} className="h-14 flex-1 rounded-full bg-surface-2 text-[16px]">
            Keep editing
          </button>
          <button type="button" onClick={leave} className="h-14 flex-1 rounded-full bg-like text-[16px] font-medium text-white">
            Discard
          </button>
        </div>
      </Sheet>

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete your listing?">
        <p className="text-[15px] text-fg-muted">Your details and photos are removed from this device. This can&apos;t be undone.</p>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={() => setConfirmDelete(false)} className="h-14 flex-1 rounded-full bg-surface-2 text-[16px]">
            Keep it
          </button>
          <button
            type="button"
            onClick={() => {
              remove();
              toast("Listing deleted");
              router.push("/me");
            }}
            className="h-14 flex-1 rounded-full bg-like text-[16px] font-medium text-white"
          >
            Delete
          </button>
        </div>
      </Sheet>
    </form>
  );
}

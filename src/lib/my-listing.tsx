"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ProfilesProvider, useProfiles } from "./profiles";
import type { Availability, Photo, Profile, Tag } from "./types";

// The signed-in advertiser's own listing, kept in localStorage until accounts
// exist. Field names and limits mirror the `listings` and `listing_photos`
// tables on the backend branch, so the save/load functions can be swapped for
// Supabase calls (saveListing + uploadListingPhoto) without touching the UI.

/** Profile id used for the advertiser's own listing. Too short to clash with a real slug. */
export const MY_LISTING_ID = "me";

export type ListingPhotoDraft = {
  id: string;
  /** Data URL locally; a signed storage URL once uploads go to Supabase. */
  url: string;
  position: number;
  /** Only shown to age-checked visitors. */
  is_locked: boolean;
};

export type StoryDraft = {
  caption: string;
  now_playing: string;
  slides: { id: string; url: string }[];
};

export type MyListing = {
  slug: string;
  display_name: string;
  age: number;
  /** Town or area only. Never an address. */
  area: string;
  bio: string;
  availability: Availability;
  tags: Tag[];
  photos: ListingPhotoDraft[];
  /** Not in the backend schema yet ("Stories" is listed as not built). */
  story?: StoryDraft;
  created_at: string;
  updated_at: string;
};

/** Same rules as the database checks on `listings`. */
export const LIMITS = {
  displayName: 40,
  ageMin: 18,
  ageMax: 99,
  bio: 2000,
  areaMin: 2,
  areaMax: 80,
  tags: 12,
  tagLabel: 30,
  photos: 10,
  storyCaption: 80,
  storySlides: 5,
} as const;

export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{2,39}$/;

export const emptyListing = (): MyListing => ({
  slug: "",
  display_name: "",
  age: 18,
  area: "",
  bio: "",
  availability: "offline",
  tags: [],
  photos: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export type ListingErrors = Partial<Record<"display_name" | "slug" | "age" | "area" | "bio" | "tags" | "photos" | "story", string>>;

export function validateListing(l: MyListing): ListingErrors {
  const e: ListingErrors = {};
  const name = l.display_name.trim();
  if (!name) e.display_name = "Add a display name.";
  else if (name.length > LIMITS.displayName) e.display_name = `Keep it under ${LIMITS.displayName} characters.`;
  if (!SLUG_PATTERN.test(l.slug)) e.slug = "3–40 characters: lowercase letters, numbers and hyphens, starting with a letter or number.";
  if (!Number.isInteger(l.age) || l.age < LIMITS.ageMin || l.age > LIMITS.ageMax)
    e.age = `You must be ${LIMITS.ageMin} or over. Enter an age between ${LIMITS.ageMin} and ${LIMITS.ageMax}.`;
  const area = l.area.trim();
  if (area.length < LIMITS.areaMin || area.length > LIMITS.areaMax) e.area = "Add a town or area, like Shoreditch, London.";
  else if (/\d/.test(area)) e.area = "Town or area only. Leave out house numbers and postcodes.";
  if (l.bio.length > LIMITS.bio) e.bio = `Keep it under ${LIMITS.bio} characters.`;
  if (l.tags.length > LIMITS.tags) e.tags = `Up to ${LIMITS.tags} tags.`;
  if (l.photos.length > LIMITS.photos) e.photos = `Up to ${LIMITS.photos} photos.`;
  else if (l.photos.length && sortPhotos(l.photos)[0].is_locked) e.photos = "Your cover photo can't be locked. Pick a public photo as your cover.";
  if (l.story && l.story.caption.length > LIMITS.storyCaption) e.story = `Keep the caption under ${LIMITS.storyCaption} characters.`;
  return e;
}

export const sortPhotos = (photos: ListingPhotoDraft[]) => [...photos].sort((a, b) => a.position - b.position);

const tint: [string, string] = ["#d4ff3f", "#1c1c1c"];

/** The listing as visitors see it, in the shape every screen already uses. */
export function listingToProfile(l: MyListing): Profile {
  const sorted = sortPhotos(l.photos);
  const visible: Photo[] = sorted
    .filter((p) => !p.is_locked)
    .map((p, i) => ({ src: p.url, tint, alt: `${l.display_name}, photo ${i + 1}` }));
  const slides = l.story?.slides ?? [];
  return {
    id: MY_LISTING_ID,
    displayName: l.display_name,
    age: l.age,
    // Verification happens through the ID check, never through editing.
    verified: false,
    availability: l.availability,
    area: l.area,
    distanceMiles: 0,
    mapPosition: { x: 0.5, y: 0.55 },
    bio: l.bio,
    tags: l.tags,
    photos: visible.length ? visible : [{ tint, alt: l.display_name }],
    lockedCount: sorted.filter((p) => p.is_locked).length,
    story: slides.length
      ? {
          id: MY_LISTING_ID,
          caption: l.story!.caption,
          nowPlaying: l.story!.now_playing || undefined,
          slides: slides.map((s, i) => ({ src: s.url, tint, alt: `${l.display_name}, story ${i + 1}` })),
        }
      : undefined,
    createdAt: l.created_at,
    lastActiveAt: l.updated_at,
  };
}

type Ctx = {
  listing: MyListing | null;
  profile: Profile | null;
  /** False until localStorage has been read, so pages don't flash an empty state. */
  loaded: boolean;
  save: (l: MyListing) => void;
  remove: () => void;
};

const MyListingCtx = createContext<Ctx | null>(null);
const KEY = "my-listing";

export function MyListingProvider({ children }: { children: React.ReactNode }) {
  const [listing, setListing] = useState<MyListing | null>(null);
  const [loaded, setLoaded] = useState(false);
  const others = useProfiles();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setListing(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  /** Throws when the browser is out of storage, so the editor can say so. */
  const save = useCallback((l: MyListing) => {
    const next = { ...l, updated_at: new Date().toISOString() };
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      throw new Error("Not enough storage on this device. Remove a photo or two and try again.");
    }
    setListing(next);
  }, []);

  const remove = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    setListing(null);
  }, []);

  const profile = useMemo(() => (listing ? listingToProfile(listing) : null), [listing]);
  const value = useMemo(() => ({ listing, profile, loaded, save, remove }), [listing, profile, loaded, save, remove]);
  // Re-provide the profile list with the advertiser's own listing first, so it
  // shows up in Explore, Saved and the filters like any other listing.
  const withMine = useMemo(() => (profile ? [profile, ...others] : others), [profile, others]);

  return (
    <MyListingCtx.Provider value={value}>
      <ProfilesProvider profiles={withMine}>{children}</ProfilesProvider>
    </MyListingCtx.Provider>
  );
}

export function useMyListing() {
  const ctx = useContext(MyListingCtx);
  if (!ctx) throw new Error("useMyListing must be used inside MyListingProvider");
  return ctx;
}

/** Puts the advertiser's own listing in front of a server-loaded list. */
export function useWithMyListing(profiles: Profile[]) {
  const { profile } = useMyListing();
  return useMemo(() => (profile ? [profile, ...profiles.filter((p) => p.id !== MY_LISTING_ID)] : profiles), [profile, profiles]);
}

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { deleteMyListing, loadMyListing, saveMyListing, type RemoteListing } from "./data/my-listing-remote";
import { ProfilesProvider, useProfiles } from "./profiles";
import type { Availability, Photo, Profile, Tag } from "./types";

// The advertiser's own listing. For a signed-in advertiser it lives in
// Supabase (`listings` + `listing_photos`); otherwise it's kept in
// localStorage so the editor still works in the mock-data preview.

/** Profile id used for the advertiser's own listing. Too short to clash with a real slug. */
export const MY_LISTING_ID = "me";

export type ListingPhotoDraft = {
  id: string;
  /** Data URL locally; a signed storage URL once uploads go to Supabase. */
  url: string;
  position: number;
  /** Only shown to age-checked visitors. */
  is_locked: boolean;
  /** Moderation state, once saved to the backend. */
  status?: "pending" | "approved" | "rejected";
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
  /** Moderation state when the listing is stored in the backend. */
  remote: Pick<RemoteListing, "status" | "needsReview" | "listingId"> | null;
  /** False until the listing has been loaded, so pages don't flash an empty state. */
  loaded: boolean;
  /** Rejects with a user-facing message when saving fails. */
  save: (l: MyListing) => Promise<void>;
  remove: () => Promise<void>;
};

const MyListingCtx = createContext<Ctx | null>(null);
const KEY = "my-listing";
// Stories aren't in the backend schema yet, so they stay on the device.
const STORY_KEY = "my-listing-story";

function readLocal<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

/** Throws when the browser is out of storage, so the editor can say so. */
function writeLocal(key: string, value: unknown) {
  try {
    if (value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error("Not enough storage on this device. Remove a photo or two and try again.");
  }
}

/** accountId is set for a signed-in advertiser when Supabase is configured. */
export function MyListingProvider({ accountId, children }: { accountId?: string; children: React.ReactNode }) {
  const [listing, setListing] = useState<MyListing | null>(null);
  const [loaded, setLoaded] = useState(false);
  const remoteRef = useRef<RemoteListing | null>(null);
  const [remote, setRemote] = useState<RemoteListing | null>(null);
  const others = useProfiles();

  const applyRemote = useCallback((r: RemoteListing | null) => {
    remoteRef.current = r;
    setRemote(r);
    setListing(r ? { ...r, story: readLocal(STORY_KEY) } : null);
  }, []);

  useEffect(() => {
    if (!accountId) {
      setListing(readLocal<MyListing>(KEY) ?? null);
      setLoaded(true);
      return;
    }
    let cancelled = false;
    loadMyListing(accountId)
      .then((r) => !cancelled && applyRemote(r))
      .catch(() => {})
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [accountId, applyRemote]);

  const save = useCallback(
    async (l: MyListing) => {
      if (accountId) {
        writeLocal(STORY_KEY, l.story);
        applyRemote(await saveMyListing(accountId, l, remoteRef.current));
        return;
      }
      const next = { ...l, updated_at: new Date().toISOString() };
      writeLocal(KEY, next);
      setListing(next);
    },
    [accountId, applyRemote],
  );

  const remove = useCallback(async () => {
    if (accountId && remoteRef.current) await deleteMyListing(remoteRef.current);
    try {
      localStorage.removeItem(accountId ? STORY_KEY : KEY);
    } catch {}
    applyRemote(null);
  }, [accountId, applyRemote]);

  const profile = useMemo(() => (listing ? listingToProfile(listing) : null), [listing]);
  const remoteState = useMemo(
    () => (remote ? { status: remote.status, needsReview: remote.needsReview, listingId: remote.listingId } : null),
    [remote],
  );
  const value = useMemo(
    () => ({ listing, profile, remote: remoteState, loaded, save, remove }),
    [listing, profile, remoteState, loaded, save, remove],
  );
  // Re-provide the profile list with the advertiser's own listing first, so it
  // shows up in Explore, Saved and the filters like any other listing. Once
  // published it's also in the server list under its slug, so drop that copy.
  const withMine = useMemo(
    () => (profile ? [profile, ...others.filter((p) => p.id !== listing?.slug)] : others),
    [profile, others, listing?.slug],
  );

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

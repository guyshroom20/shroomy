import "server-only";
import type { Tables } from "@/lib/supabase/database.types";
import { PHOTO_BUCKET } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Photo, Profile, Tag } from "@/lib/types";

type ListingRow = Tables<"listings"> & { listing_photos: Tables<"listing_photos">[] };

const SIGNED_URL_TTL = 60 * 60;

// Placeholder gradients shown while an image loads.
const tints: [string, string][] = [
  ["#f59e0b", "#7c2d12"],
  ["#ef4444", "#3b0764"],
  ["#60a5fa", "#1e3a8a"],
  ["#34d399", "#064e3b"],
  ["#f472b6", "#4c0519"],
  ["#818cf8", "#1e1b4b"],
];
const tintFor = (id: string) => tints[parseInt(id.slice(0, 2), 16) % tints.length];

function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}

/** Signed URLs for every visible photo. RLS has already dropped the ones this viewer can't see. */
async function signPhotos(rows: ListingRow[]) {
  const paths = rows.flatMap((r) => r.listing_photos.map((p) => p.storage_path));
  if (paths.length === 0) return new Map<string, string>();
  const supabase = await createClient();
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
  return new Map((data ?? []).flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl] as const] : [])));
}

function toProfile(row: ListingRow, urls: Map<string, string>, origin?: { lat: number; lng: number }): Profile {
  const photos: Photo[] = [...row.listing_photos]
    .sort((a, b) => a.position - b.position)
    .map((p, i) => ({ src: urls.get(p.storage_path), tint: tintFor(p.id), alt: `${row.display_name}, photo ${i + 1}` }));
  const visibleLocked = row.listing_photos.filter((p) => p.is_locked).length;
  const lat = Number(row.approx_lat);
  const lng = Number(row.approx_lng);
  const hasPin = row.approx_lat !== null && row.approx_lng !== null;

  return {
    id: row.slug,
    displayName: row.display_name,
    age: row.age,
    // Only ID-verified advertisers can be published.
    verified: row.status === "published",
    availability: row.availability,
    area: row.area,
    distanceMiles: origin && hasPin ? Math.round(milesBetween(origin, { lat, lng }) * 10) / 10 : 0,
    mapPosition: { x: 0.5, y: 0.5 },
    bio: row.bio,
    tags: (row.tags as Tag[]) ?? [],
    photos: photos.length ? photos : [{ tint: tintFor(row.id), alt: row.display_name }],
    lockedCount: Math.max(row.locked_photo_count - visibleLocked, 0),
  };
}

/** Spreads pins across the map viewport, keeping their relative positions. */
function placeOnMap(profiles: Profile[], rows: ListingRow[]) {
  const pins = rows.map((r) => ({ lat: Number(r.approx_lat), lng: Number(r.approx_lng) }));
  const lats = pins.map((p) => p.lat).filter(Number.isFinite);
  const lngs = pins.map((p) => p.lng).filter(Number.isFinite);
  if (!lats.length) return;
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  profiles.forEach((p, i) => {
    const { lat, lng } = pins[i];
    if (!Number.isFinite(lat)) return;
    p.mapPosition = {
      x: 0.12 + 0.76 * (maxLng === minLng ? 0.5 : (lng - minLng) / (maxLng - minLng)),
      y: 0.12 + 0.76 * (maxLat === minLat ? 0.5 : (maxLat - lat) / (maxLat - minLat)),
    };
  });
}

/** Published listings, newest first, shaped for the existing screens. */
export async function getPublishedProfiles(options: { origin?: { lat: number; lng: number }; limit?: number } = {}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*, listing_photos(*)")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(options.limit ?? 60);
  if (error) throw error;
  const rows = data as ListingRow[];
  const urls = await signPhotos(rows);
  const profiles = rows.map((r) => toProfile(r, urls, options.origin));
  placeOnMap(profiles, rows);
  return profiles;
}

/** One listing by its slug (the profile id used in URLs), or null. */
export async function getProfileBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("listings").select("*, listing_photos(*)").eq("slug", slug).maybeSingle();
  if (!data) return null;
  const row = data as ListingRow;
  return { profile: toProfile(row, await signPhotos([row])), listingId: row.id, advertiserId: row.advertiser_id };
}

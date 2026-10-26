import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";
import { PHOTO_BUCKET } from "@/lib/supabase/env";
import type { Tag } from "@/lib/types";
import type { ListingPhotoDraft, MyListing } from "@/lib/my-listing";

// Loads and saves the advertiser's own listing in Supabase, in the shape the
// My listing editor already uses. Photos the editor added locally arrive as
// data URLs and are uploaded on save.

type Row = Tables<"listings"> & { listing_photos: Tables<"listing_photos">[] };

export type RemoteListing = MyListing & { listingId: string; status: Tables<"listings">["status"]; needsReview: boolean };

export async function loadMyListing(accountId: string): Promise<RemoteListing | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*, listing_photos(*)")
    .eq("advertiser_id", accountId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as Row;
  const paths = row.listing_photos.map((p) => p.storage_path);
  const { data: signed } = paths.length
    ? await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 60 * 60)
    : { data: [] };
  const urls = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
  return {
    listingId: row.id,
    status: row.status,
    needsReview: row.needs_review,
    slug: row.slug,
    display_name: row.display_name,
    age: row.age,
    area: row.area,
    bio: row.bio,
    availability: row.availability,
    tags: (row.tags as Tag[]) ?? [],
    photos: row.listing_photos.map((p) => ({
      id: p.id,
      url: urls.get(p.storage_path) ?? "",
      position: p.position,
      is_locked: p.is_locked,
      status: p.status,
    })),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const friendly = (error: { code?: string; message: string }) => {
  if (error.code === "23505") return "That profile link is taken. Try another.";
  if (error.message.includes("Age must match")) return "Your age must match your verified ID.";
  if (error.message.includes("listings_slug_not_reserved")) return "That profile link is reserved. Try another.";
  return "Couldn't save your listing. Check your connection and try again.";
};

/** Saves the fields, then brings photos in line with the draft: upload new, update changed, delete removed. */
export async function saveMyListing(accountId: string, draft: MyListing, current: RemoteListing | null) {
  const supabase = createClient();
  const fields = {
    slug: draft.slug,
    display_name: draft.display_name,
    age: draft.age,
    area: draft.area,
    bio: draft.bio,
    availability: draft.availability,
    tags: draft.tags,
  };
  const { data: saved, error } = current
    ? await supabase.from("listings").update(fields).eq("id", current.listingId).select("id").single()
    : await supabase.from("listings").insert(fields).select("id").single();
  if (error) throw new Error(friendly(error));
  const listingId = saved.id;

  const before = new Map((current?.photos ?? []).map((p) => [p.id, p]));
  const keep = new Set(draft.photos.map((p) => p.id));

  const removed = [...before.values()].filter((p) => !keep.has(p.id));
  if (removed.length) {
    const { data: rows } = await supabase.from("listing_photos").select("storage_path").in("id", removed.map((p) => p.id));
    await supabase.from("listing_photos").delete().in("id", removed.map((p) => p.id));
    if (rows?.length) await supabase.storage.from(PHOTO_BUCKET).remove(rows.map((r) => r.storage_path));
  }

  for (const photo of draft.photos) {
    const old = before.get(photo.id);
    if (!old) {
      await uploadDraftPhoto(listingId, photo);
    } else if (old.position !== photo.position || old.is_locked !== photo.is_locked) {
      const { error: e } = await supabase
        .from("listing_photos")
        .update({ position: photo.position, is_locked: photo.is_locked })
        .eq("id", photo.id);
      if (e) throw new Error("Couldn't update a photo. Try again.");
    }
  }
  return loadMyListing(accountId);
}

async function uploadDraftPhoto(listingId: string, photo: ListingPhotoDraft) {
  const supabase = createClient();
  const blob = await (await fetch(photo.url)).blob();
  const path = `${listingId}/${crypto.randomUUID()}.jpg`;
  const { error: upErr } = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: "image/jpeg" });
  if (upErr) throw new Error("Couldn't upload a photo. Try again.");
  const { error } = await supabase
    .from("listing_photos")
    .insert({ listing_id: listingId, storage_path: path, position: photo.position, is_locked: photo.is_locked });
  if (error) {
    await supabase.storage.from(PHOTO_BUCKET).remove([path]);
    throw new Error("Couldn't save a photo. Try again.");
  }
}

export async function deleteMyListing(current: RemoteListing) {
  const supabase = createClient();
  const { data: rows } = await supabase.from("listing_photos").select("storage_path").eq("listing_id", current.listingId);
  const { error } = await supabase.from("listings").delete().eq("id", current.listingId);
  if (error) throw new Error("Couldn't delete your listing. Try again.");
  if (rows?.length) await supabase.storage.from(PHOTO_BUCKET).remove(rows.map((r) => r.storage_path));
}

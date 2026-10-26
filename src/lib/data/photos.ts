import { createClient } from "@/lib/supabase/client";
import { PHOTO_BUCKET } from "@/lib/supabase/env";

const MAX_EDGE = 2048;

/**
 * Re-encodes an image in the browser before upload. Drawing to a canvas
 * drops all metadata, including GPS location in phone photos, and caps the size.
 */
export async function cleanImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't read that image"))), "image/jpeg", 0.88),
  );
}

/** Uploads a photo to the advertiser's listing. It stays hidden until a moderator approves it. */
export async function uploadListingPhoto(listingId: string, file: File, opts: { position: number; locked: boolean }) {
  const supabase = createClient();
  const path = `${listingId}/${crypto.randomUUID()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, await cleanImage(file), { contentType: "image/jpeg" });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("listing_photos")
    .insert({ listing_id: listingId, storage_path: path, position: opts.position, is_locked: opts.locked })
    .select()
    .single();
  if (error) {
    await supabase.storage.from(PHOTO_BUCKET).remove([path]);
    throw error;
  }
  return data;
}

export async function deleteListingPhoto(photo: { id: string; storage_path: string }) {
  const supabase = createClient();
  const { error } = await supabase.from("listing_photos").delete().eq("id", photo.id);
  if (error) throw error;
  await supabase.storage.from(PHOTO_BUCKET).remove([photo.storage_path]);
}

export async function setPhotoLocked(photoId: string, locked: boolean) {
  const { error } = await createClient().from("listing_photos").update({ is_locked: locked }).eq("id", photoId);
  if (error) throw error;
}

// Same approach as the backend's cleanImage (src/lib/data/photos.ts on the
// backend branch): re-encoding through a canvas drops all metadata, including
// GPS location in phone photos. The edge is smaller here because the local
// store keeps photos in localStorage until uploads go to Supabase.

const MAX_EDGE = 1280;

/** Re-encodes an image in the browser and returns it as a JPEG data URL. */
export async function cleanImageToDataUrl(file: File, maxEdge = MAX_EDGE): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.8);
}

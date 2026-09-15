/**
 * Client-side image preparation for avatar uploads (PRD FR-P3, SEC-6).
 *
 * Redrawing through a canvas does three jobs at once:
 *
 *  1. Downsizes, so a 6 MB phone photo becomes ~40 KB and stays inside the
 *     free storage tier.
 *  2. Crops to a square, so the UI never has to letterbox.
 *  3. Strips EXIF entirely. Phone photos carry GPS coordinates, and uploading
 *     them raw would publish a user's home address alongside their face.
 *     The canvas re-encode discards all metadata as a side effect, which is
 *     why this runs before upload rather than after.
 */

export const AVATAR_SIZE = 512;
export const MAX_SOURCE_BYTES = 12 * 1024 * 1024;

export class ImageError extends Error {}

export async function prepareAvatar(
  file: File,
  size = AVATAR_SIZE,
): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new ImageError("That file isn't an image.");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new ImageError("That image is too large. Try one under 12 MB.");
  }

  let bitmap: ImageBitmap;
  try {
    // from-image honours the orientation flag, otherwise photos taken in
    // portrait arrive rotated on the way in.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ImageError("That image couldn't be read. Try a different one.");
  }

  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImageError("Your browser couldn't process that image.");

  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.85),
  );

  if (!blob) throw new ImageError("Couldn't process that image. Try another.");
  return blob;
}

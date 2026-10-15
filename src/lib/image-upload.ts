"use client";

import { ALLOWED_IMAGE_TYPES, IMAGE_BUCKET, MAX_UPLOAD_BYTES } from "@/config/site";
import { createClient } from "@/lib/supabase/client";

export type ImageKind = "item" | "logo" | "cover";

const MAX_SOURCE_BYTES = 10 * 1024 * 1024; // before compression
const MAX_DIMENSION: Record<ImageKind, number> = { item: 1200, logo: 512, cover: 1600 };

export function validateImageFile(file: File): string | null {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Please choose a JPG, PNG or WebP image.";
  }
  if (file.size > MAX_SOURCE_BYTES) {
    return "This image is too large (max 10 MB before upload).";
  }
  return null;
}

/** Resizes + re-encodes in the browser so uploads stay small and fast. */
export async function compressImage(file: File, kind: ImageKind): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const max = MAX_DIMENSION[kind];
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image processing is not supported in this browser.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const encode = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

  let blob = await encode("image/webp", 0.82);
  if (!blob || blob.type !== "image/webp") blob = await encode("image/jpeg", 0.85);
  if (!blob) throw new Error("Could not process this image.");

  if (blob.size > MAX_UPLOAD_BYTES) {
    blob = await encode(blob.type, 0.6);
    if (!blob || blob.size > MAX_UPLOAD_BYTES) {
      throw new Error("This image is too large even after compression.");
    }
  }
  return blob;
}

/**
 * Uploads to `<restaurantId>/<kind>-<uuid>.<ext>`. Storage RLS only allows
 * writing into folders of restaurants the signed-in user owns, and the
 * bucket enforces type and size limits server-side.
 */
export async function uploadMenuImage(
  file: File,
  kind: ImageKind,
  restaurantId: string,
): Promise<string> {
  const problem = validateImageFile(file);
  if (problem) throw new Error(problem);

  const blob = await compressImage(file, kind);
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const path = `${restaurantId}/${kind}-${crypto.randomUUID()}.${ext}`;

  const supabase = createClient();
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, blob, {
    contentType: blob.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error("Upload failed. Please try again.");

  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

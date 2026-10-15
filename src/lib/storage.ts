import { IMAGE_BUCKET } from "@/config/site";

/** Public URL prefix for objects in the menu image bucket. */
export function publicBucketPrefix(supabaseUrl: string): string {
  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${IMAGE_BUCKET}/`;
}

const SAFE_OBJECT_NAME = /^[a-z0-9-]+\.(?:jpe?g|png|webp)$/i;

/**
 * Returns the storage object path (`<restaurantId>/<file>`) if `url` is a
 * public image URL inside this restaurant's folder, otherwise null. Used to
 * reject image URLs pointing anywhere else (another tenant, external hosts).
 */
export function ownedObjectPath(
  url: string,
  supabaseUrl: string,
  restaurantId: string,
): string | null {
  const prefix = publicBucketPrefix(supabaseUrl);
  if (!url.startsWith(prefix)) return null;
  const objectPath = url.slice(prefix.length);
  const [folder, file, ...rest] = objectPath.split("/");
  if (rest.length > 0 || folder !== restaurantId || !file) return null;
  if (!SAFE_OBJECT_NAME.test(file)) return null;
  return objectPath;
}

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const CATEGORY_ICON_MIME = new Set([...ALLOWED_MIME, "image/svg+xml"]);

export const MEDIA_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const MAX_PRODUCT_GALLERY_IMAGES = 12;

/** True when a FormData entry is a non-empty uploaded image file. */
export function isNonEmptyImageFile(
  entry: FormDataEntryValue,
): entry is File {
  return entry instanceof File && entry.size > 0;
}

export function extensionForImageMime(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  if (mimeType === "image/svg+xml") return "svg";
  return "jpg";
}

/** Validates MIME and size for admin image uploads. */
export function validateImageFile(
  file: File,
  maxBytes = MEDIA_IMAGE_MAX_BYTES,
): string | null {
  if (!ALLOWED_MIME.has(file.type)) {
    return "Only JPEG, PNG, WebP, or GIF images are allowed.";
  }
  if (file.size > maxBytes) {
    return `Image must be ${Math.floor(maxBytes / (1024 * 1024))}MB or smaller.`;
  }
  return null;
}

/** Category rail icons may also be the same SVG glyphs used on the storefront. */
export function validateCategoryIconFile(
  file: File,
  maxBytes = MEDIA_IMAGE_MAX_BYTES,
): string | null {
  if (!CATEGORY_ICON_MIME.has(file.type)) {
    return "Only JPEG, PNG, WebP, GIF, or SVG images are allowed.";
  }
  if (file.size > maxBytes) {
    return `Image must be ${Math.floor(maxBytes / (1024 * 1024))}MB or smaller.`;
  }
  return null;
}

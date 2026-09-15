import "server-only";

import { and, eq, or } from "drizzle-orm";

import { getProviders } from "@/config/providers";
import { getDb } from "@/db/client";
import { mediaAssets } from "@/db/schema";
import { createId } from "@/lib/id";
import {
  extensionForImageMime,
  validateCategoryIconFile,
  validateImageFile,
} from "@/lib/media/image-file";

export const CATEGORY_ICON_ROLE = "PRIMARY" as const;
export const CATEGORY_BANNER_ROLE = "COVER" as const;

type CategoryMediaRole =
  | typeof CATEGORY_ICON_ROLE
  | typeof CATEGORY_BANNER_ROLE;

function mediaWhere(categoryId: string, role: CategoryMediaRole) {
  if (role === CATEGORY_BANNER_ROLE) {
    return and(
      eq(mediaAssets.categoryId, categoryId),
      eq(mediaAssets.role, CATEGORY_BANNER_ROLE),
    );
  }

  return and(
    eq(mediaAssets.categoryId, categoryId),
    or(
      eq(mediaAssets.role, CATEGORY_ICON_ROLE),
      eq(mediaAssets.isPrimary, true),
    ),
  );
}

async function removeCategoryMediaByRole(
  categoryId: string,
  role: CategoryMediaRole,
): Promise<void> {
  const db = getDb();
  const storage = getProviders().storage;
  const existing = await db
    .select({ id: mediaAssets.id, objectKey: mediaAssets.objectKey })
    .from(mediaAssets)
    .where(mediaWhere(categoryId, role));

  if (existing.length === 0) return;

  await db.delete(mediaAssets).where(mediaWhere(categoryId, role));
  await Promise.all(
    existing.map((row) => storage.deleteObject(row.objectKey)),
  );
}

async function persistCategoryMedia(
  categoryId: string,
  file: File,
  role: CategoryMediaRole,
): Promise<{ error: string | null }> {
  const validationError =
    role === CATEGORY_ICON_ROLE
      ? validateCategoryIconFile(file)
      : validateImageFile(file);
  if (validationError) {
    return { error: validationError };
  }

  await removeCategoryMediaByRole(categoryId, role);

  const id = createId();
  const objectKey = `uploads/categories/${categoryId}/${id}.${extensionForImageMime(file.type)}`;
  await getProviders().storage.putObject({
    objectKey,
    body: Buffer.from(await file.arrayBuffer()),
    contentType: file.type,
  });

  await getDb().insert(mediaAssets).values({
    id,
    objectKey,
    mimeType: file.type,
    byteSize: file.size,
    uploadStatus: "READY",
    role,
    sortOrder: role === CATEGORY_BANNER_ROLE ? 1 : 0,
    isPrimary: role === CATEGORY_ICON_ROLE,
    categoryId,
  });

  return { error: null };
}

/** Saves the category rail/icon image without touching the promo banner. */
export async function persistCategoryImage(
  categoryId: string,
  file: File,
): Promise<{ error: string | null }> {
  return persistCategoryMedia(categoryId, file, CATEGORY_ICON_ROLE);
}

/** Saves the mega-menu promo banner image for a root category. */
export async function persistCategoryBannerImage(
  categoryId: string,
  file: File,
): Promise<{ error: string | null }> {
  return persistCategoryMedia(categoryId, file, CATEGORY_BANNER_ROLE);
}

/** Removes the category rail/icon image. */
export async function removeCategoryImage(categoryId: string): Promise<void> {
  await removeCategoryMediaByRole(categoryId, CATEGORY_ICON_ROLE);
}

/** Removes the mega-menu promo banner image. */
export async function removeCategoryBannerImage(
  categoryId: string,
): Promise<void> {
  await removeCategoryMediaByRole(categoryId, CATEGORY_BANNER_ROLE);
}

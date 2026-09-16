import "server-only";

import { eq } from "drizzle-orm";

import { getProviders } from "@/config/providers";
import { getDb } from "@/db/client";
import { mediaAssets } from "@/db/schema";
import { createId } from "@/lib/id";
import {
  extensionForImageMime,
  validateImageFile,
} from "@/lib/media/image-file";
import { putStoredObject } from "@/lib/media/put-stored-object";

/** Saves a single primary image for a brand via object storage. */
export async function persistBrandImage(
  brandId: string,
  file: File,
): Promise<{ error: string | null }> {
  const validationError = validateImageFile(file);
  if (validationError) {
    return { error: validationError };
  }

  const db = getDb();
  const storage = getProviders().storage;
  const existing = await db
    .select({ id: mediaAssets.id, objectKey: mediaAssets.objectKey })
    .from(mediaAssets)
    .where(eq(mediaAssets.brandId, brandId));

  const id = createId();
  const objectKey = `uploads/brands/${brandId}/${id}.${extensionForImageMime(file.type)}`;
  const uploadError = await putStoredObject({
    objectKey,
    body: Buffer.from(await file.arrayBuffer()),
    contentType: file.type,
  });
  if (uploadError) {
    return { error: uploadError };
  }

  if (existing.length > 0) {
    await db.delete(mediaAssets).where(eq(mediaAssets.brandId, brandId));
    await Promise.all(
      existing.map((row) => storage.deleteObject(row.objectKey)),
    );
  }

  await db.insert(mediaAssets).values({
    id,
    objectKey,
    mimeType: file.type,
    byteSize: file.size,
    uploadStatus: "READY",
    role: "PRIMARY",
    sortOrder: 0,
    isPrimary: true,
    brandId,
  });

  return { error: null };
}

/** Removes all media rows for a brand and deletes stored objects. */
export async function removeBrandImage(brandId: string): Promise<void> {
  const db = getDb();
  const storage = getProviders().storage;
  const existing = await db
    .select({ objectKey: mediaAssets.objectKey })
    .from(mediaAssets)
    .where(eq(mediaAssets.brandId, brandId));

  await db.delete(mediaAssets).where(eq(mediaAssets.brandId, brandId));
  await Promise.all(existing.map((row) => storage.deleteObject(row.objectKey)));
}

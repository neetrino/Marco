import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";

import { getProviders } from "@/config/providers";
import { getDb } from "@/db/client";
import { mediaAssets } from "@/db/schema";
import { resolveProductPrimaryImageId } from "@/features/products/domain/product-media-primary";
import { createId } from "@/lib/id";
import {
  extensionForImageMime,
  MAX_PRODUCT_GALLERY_IMAGES,
  validateImageFile,
} from "@/lib/media/image-file";
import { logger } from "@/lib/observability/logger";
import { putStoredObject } from "@/lib/media/put-stored-object";
import { mediaPublicUrl } from "@/lib/media/public-url";

const IMAGE_WRITE_FAILED = "Image upload failed. Please try again.";

async function insertProductImage(input: {
  productId: string;
  file: File;
  sortOrder: number;
}): Promise<{ id: string } | { error: string }> {
  const buffered = await readImageBuffer(input.file);
  if ("error" in buffered) return buffered;

  const id = createId();
  const objectKey = `uploads/products/${input.productId}/${id}.${extensionForImageMime(input.file.type)}`;
  const uploadError = await putStoredObject({
    objectKey,
    body: buffered.body,
    contentType: input.file.type,
  });
  if (uploadError) return { error: uploadError };

  try {
    await getDb().insert(mediaAssets).values({
      id,
      objectKey,
      mimeType: input.file.type,
      byteSize: input.file.size,
      uploadStatus: "READY",
      role: "GALLERY",
      sortOrder: input.sortOrder,
      isPrimary: false,
      productId: input.productId,
    });
  } catch (error) {
    logger.error("products.insert_image_failed", {
      productId: input.productId,
      message: error instanceof Error ? error.message : "unknown",
    });
    await getProviders().storage.deleteObject(objectKey);
    return { error: IMAGE_WRITE_FAILED };
  }

  return { id };
}

async function readImageBuffer(
  file: File,
): Promise<{ body: Buffer } | { error: string }> {
  try {
    const body = Buffer.from(await file.arrayBuffer());
    if (body.byteLength <= 0) {
      return { error: IMAGE_WRITE_FAILED };
    }
    return { body };
  } catch (error) {
    logger.error("products.read_image_buffer_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return { error: IMAGE_WRITE_FAILED };
  }
}

export type ProductMediaInput = {
  productId: string;
  files: File[];
  primaryNewIndex: number | null;
  primaryExistingId: string | null;
  removeImageIds: string[];
};

/** Saves new product images and updates primary/removal via object storage. */
export async function persistProductMedia(
  input: ProductMediaInput,
): Promise<{ error: string | null }> {
  try {
    return await persistProductMediaUnchecked(input);
  } catch (error) {
    logger.error("products.persist_media_failed", {
      productId: input.productId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return { error: IMAGE_WRITE_FAILED };
  }
}

async function persistProductMediaUnchecked(
  input: ProductMediaInput,
): Promise<{ error: string | null }> {
  const db = getDb();
  const storage = getProviders().storage;
  const existing = await db
    .select({
      id: mediaAssets.id,
      objectKey: mediaAssets.objectKey,
      isPrimary: mediaAssets.isPrimary,
    })
    .from(mediaAssets)
    .where(eq(mediaAssets.productId, input.productId))
    .orderBy(asc(mediaAssets.sortOrder));

  const remainingAfterRemove = existing.filter(
    (row) => !input.removeImageIds.includes(row.id),
  );

  if (remainingAfterRemove.length + input.files.length > MAX_PRODUCT_GALLERY_IMAGES) {
    return {
      error: `At most ${MAX_PRODUCT_GALLERY_IMAGES} images are allowed.`,
    };
  }

  for (const file of input.files) {
    const validationError = validateImageFile(file);
    if (validationError) {
      return {
        error:
          validationError === "Image must be 5MB or smaller."
            ? "Each image must be 5MB or smaller."
            : validationError,
      };
    }
  }

  if (input.removeImageIds.length > 0) {
    const toRemove = existing.filter((row) =>
      input.removeImageIds.includes(row.id),
    );
    if (toRemove.length > 0) {
      await db
        .delete(mediaAssets)
        .where(
          inArray(
            mediaAssets.id,
            toRemove.map((row) => row.id),
          ),
        );
      await Promise.all(
        toRemove.map((row) => storage.deleteObject(row.objectKey)),
      );
    }
  }

  const createdIds: string[] = [];
  let sortBase = remainingAfterRemove.length;

  for (const file of input.files) {
    const uploaded = await insertProductImage({
      productId: input.productId,
      file,
      sortOrder: sortBase,
    });
    if ("error" in uploaded) {
      return { error: uploaded.error };
    }
    createdIds.push(uploaded.id);
    sortBase += 1;
  }

  const nextPrimaryId = resolveProductPrimaryImageId({
    createdIds,
    primaryNewIndex: input.primaryNewIndex,
    primaryExistingId: input.primaryExistingId,
    removeImageIds: input.removeImageIds,
    remaining: remainingAfterRemove,
  });

  await db
    .update(mediaAssets)
    .set({ isPrimary: false, role: "GALLERY", updatedAt: new Date() })
    .where(
      and(
        eq(mediaAssets.productId, input.productId),
        eq(mediaAssets.isPrimary, true),
      ),
    );

  if (nextPrimaryId) {
    await db
      .update(mediaAssets)
      .set({
        isPrimary: true,
        role: "PRIMARY",
        updatedAt: new Date(),
      })
      .where(eq(mediaAssets.id, nextPrimaryId));
  }

  return { error: null };
}

/** Loads gallery images for admin product editing. */
export async function loadProductImagesForAdmin(
  productIds: string[],
): Promise<Map<string, { id: string; url: string; isPrimary: boolean }[]>> {
  const map = new Map<
    string,
    { id: string; url: string; isPrimary: boolean }[]
  >();
  if (productIds.length === 0) return map;

  const rows = await getDb()
    .select({
      id: mediaAssets.id,
      productId: mediaAssets.productId,
      objectKey: mediaAssets.objectKey,
      isPrimary: mediaAssets.isPrimary,
      sortOrder: mediaAssets.sortOrder,
    })
    .from(mediaAssets)
    .where(
      and(
        inArray(mediaAssets.productId, productIds),
        eq(mediaAssets.uploadStatus, "READY"),
      ),
    )
    .orderBy(asc(mediaAssets.sortOrder));

  for (const row of rows) {
    if (!row.productId) continue;
    const list = map.get(row.productId) ?? [];
    list.push({
      id: row.id,
      url: mediaPublicUrl(row.objectKey),
      isPrimary: row.isPrimary,
    });
    map.set(row.productId, list);
  }

  return map;
}

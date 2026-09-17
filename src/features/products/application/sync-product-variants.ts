import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { getProviders } from "@/config/providers";
import { getDb } from "@/db/client";
import {
  mediaAssets,
  products,
  productVariantAttributeValues,
  productVariants,
} from "@/db/schema";
import { DEFAULT_PRODUCT_STOCK } from "@/features/products/domain/product-stock";
import type { ProductUpsertInput } from "@/features/products/schemas/product-drawer";
import { createId } from "@/lib/id";
import {
  extensionForImageMime,
  validateImageFile,
} from "@/lib/media/image-file";
import { putStoredObject } from "@/lib/media/put-stored-object";

type VariantImageInput = {
  variantKey: string;
  file: File;
};

function collectVariantImages(formData: FormData): Map<string, File> {
  const map = new Map<string, File>();
  const keys = formData.getAll("variantImageKeys");
  const files = formData.getAll("variantImages");
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const file = files[index];
    if (typeof key !== "string" || !(file instanceof File) || file.size <= 0) {
      continue;
    }
    map.set(key, file);
  }
  return map;
}

async function persistVariantImage(
  variantId: string,
  file: File,
  removeImageId: string | null,
): Promise<string | null> {
  const validationError = validateImageFile(file);
  if (validationError) {
    return validationError === "Image must be 5MB or smaller."
      ? "Each variant image must be 5MB or smaller."
      : validationError;
  }

  const db = getDb();
  const storage = getProviders().storage;

  if (removeImageId) {
    const [existing] = await db
      .select({ id: mediaAssets.id, objectKey: mediaAssets.objectKey })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, removeImageId))
      .limit(1);
    if (existing) {
      await db.delete(mediaAssets).where(eq(mediaAssets.id, existing.id));
      await storage.deleteObject(existing.objectKey);
    }
  } else {
    const [existing] = await db
      .select({ id: mediaAssets.id, objectKey: mediaAssets.objectKey })
      .from(mediaAssets)
      .where(eq(mediaAssets.productVariantId, variantId))
      .limit(1);
    if (existing) {
      await db.delete(mediaAssets).where(eq(mediaAssets.id, existing.id));
      await storage.deleteObject(existing.objectKey);
    }
  }

  const assetId = createId();
  const ext = extensionForImageMime(file.type);
  const objectKey = `uploads/products/variants/${variantId}/${assetId}.${ext}`;
  let body: Buffer;
  try {
    body = Buffer.from(await file.arrayBuffer());
  } catch {
    return "Image upload failed. Please try again.";
  }
  const uploadError = await putStoredObject({
    objectKey,
    body,
    contentType: file.type,
  });
  if (uploadError) return uploadError;
  await db.insert(mediaAssets).values({
    id: assetId,
    objectKey,
    mimeType: file.type,
    byteSize: file.size,
    uploadStatus: "READY",
    role: "GALLERY",
    sortOrder: 0,
    isPrimary: false,
    productVariantId: variantId,
  });
  return null;
}

/** Replaces product variants and their attribute bindings from drawer payload. */
export async function syncProductVariants(
  productId: string,
  data: ProductUpsertInput,
  formData: FormData,
): Promise<string | null> {
  if (data.productType !== "VARIABLE") {
    const existing = await getDb()
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(eq(productVariants.productId, productId));
    if (existing.length === 0) return null;

    const variantIds = existing.map((row) => row.id);
    const images = await getDb()
      .select({ id: mediaAssets.id, objectKey: mediaAssets.objectKey })
      .from(mediaAssets)
      .where(inArray(mediaAssets.productVariantId, variantIds));
    const storage = getProviders().storage;
    if (images.length > 0) {
      await getDb()
        .delete(mediaAssets)
        .where(inArray(mediaAssets.id, images.map((row) => row.id)));
      await Promise.all(images.map((row) => storage.deleteObject(row.objectKey)));
    }
    await getDb()
      .delete(productVariants)
      .where(eq(productVariants.productId, productId));
    return null;
  }

  const variantImages = collectVariantImages(formData);
  const incomingIds = data.variants
    .map((variant) => variant.id)
    .filter((id): id is string => Boolean(id));

  const db = getDb();
  const existingRows = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(eq(productVariants.productId, productId));

  const removeIds = existingRows
    .map((row) => row.id)
    .filter((id) => !incomingIds.includes(id));

  if (removeIds.length > 0) {
    const images = await db
      .select({ id: mediaAssets.id, objectKey: mediaAssets.objectKey })
      .from(mediaAssets)
      .where(inArray(mediaAssets.productVariantId, removeIds));
    const storage = getProviders().storage;
    if (images.length > 0) {
      await db
        .delete(mediaAssets)
        .where(inArray(mediaAssets.id, images.map((row) => row.id)));
      await Promise.all(images.map((row) => storage.deleteObject(row.objectKey)));
    }
    await db
      .delete(productVariants)
      .where(inArray(productVariants.id, removeIds));
  }

  for (const [index, variant] of data.variants.entries()) {
    const variantId = variant.id ?? createId();
    const discountType =
      variant.discountValue > 0 ? variant.discountType : null;
    const discountValue = variant.discountValue > 0 ? variant.discountValue : null;

    if (variant.id) {
      await db
        .update(productVariants)
        .set({
          sku: variant.sku,
          priceAmount: variant.priceAmount,
          compareAtAmount: variant.compareAtAmount,
          discountType,
          discountValue,
          discountStartsAt: variant.discountStartsAt,
          discountEndsAt: variant.discountEndsAt,
          sortOrder: index,
          // Backfill unset stock (0) to the default; preserve non-zero balances.
          stockOnHand: sql`CASE WHEN ${productVariants.stockOnHand} = 0 THEN ${DEFAULT_PRODUCT_STOCK} ELSE ${productVariants.stockOnHand} END`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(productVariants.id, variant.id),
            eq(productVariants.productId, productId),
          ),
        );
    } else {
      await db.insert(productVariants).values({
        id: variantId,
        productId,
        sku: variant.sku,
        priceAmount: variant.priceAmount,
        compareAtAmount: variant.compareAtAmount,
        discountType,
        discountValue,
        discountStartsAt: variant.discountStartsAt,
        discountEndsAt: variant.discountEndsAt,
        stockOnHand: DEFAULT_PRODUCT_STOCK,
        sortOrder: index,
      });
    }

    await db
      .delete(productVariantAttributeValues)
      .where(eq(productVariantAttributeValues.variantId, variantId));

    if (variant.attributeValueIds.length > 0) {
      await db.insert(productVariantAttributeValues).values(
        variant.attributeValueIds.map((attributeValueId) => ({
          id: createId(),
          variantId,
          attributeValueId,
        })),
      );
    }

    if (variant.removeImageId) {
      const [image] = await db
        .select({ id: mediaAssets.id, objectKey: mediaAssets.objectKey })
        .from(mediaAssets)
        .where(eq(mediaAssets.id, variant.removeImageId))
        .limit(1);
      if (image) {
        await db.delete(mediaAssets).where(eq(mediaAssets.id, image.id));
        await getProviders().storage.deleteObject(image.objectKey);
      }
    }

    const imageFile = variantImages.get(variant.key);
    if (imageFile) {
      const imageError = await persistVariantImage(
        variantId,
        imageFile,
        variant.removeImageId,
      );
      if (imageError) return imageError;
    }
  }

  const [stockTotal] = await db
    .select({
      value: sql<number>`coalesce(sum(${productVariants.stockOnHand}), 0)`.mapWith(
        Number,
      ),
    })
    .from(productVariants)
    .where(eq(productVariants.productId, productId));

  await db
    .update(products)
    .set({
      stockOnHand: stockTotal?.value ?? 0,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));

  return null;
}

export function summarizeVariableProduct(
  variants: ProductUpsertInput["variants"],
  slug: string,
): { sku: string; priceAmount: number; stockOnHand: number } {
  const sorted = [...variants].sort((left, right) => left.priceAmount - right.priceAmount);
  const first = sorted[0];
  return {
    sku: first?.sku ?? `V-${slug}`,
    priceAmount: first?.priceAmount ?? 0,
    stockOnHand: variants.length * DEFAULT_PRODUCT_STOCK,
  };
}

export type { VariantImageInput };

"use server";

import { and, eq, isNull } from "drizzle-orm";

import { revalidatePath } from "next/cache";

import { getDb } from "@/db/client";
import { products } from "@/db/schema";
import { persistProductMedia } from "@/features/products/application/persist-product-media";
import {
  isNavigationControlError,
  productWriteErrorMessage,
} from "@/features/products/application/product-write-errors";
import { requireAdmin } from "@/lib/auth/policies";
import { invalidateProductsCache } from "@/lib/cache/invalidate-public";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { isNonEmptyImageFile } from "@/lib/media/image-file";
import { logger } from "@/lib/observability/logger";
import { err, ok, type Result } from "@/lib/result";

function readImageFile(formData: FormData): File | null {
  const image = formData.get("image");
  if (image == null || !isNonEmptyImageFile(image)) return null;
  return image;
}

/** Adds one gallery image to an existing product (one file per request). */
export async function attachProductMediaFromDrawerAction(
  locale: string,
  productId: string,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const file = readImageFile(formData);
  if (!file) {
    return err("VALIDATION_ERROR", "Image file is required.");
  }

  try {
    await requireAdmin(locale as Locale);

    const [existing] = await getDb()
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.id, productId), isNull(products.deletedAt)))
      .limit(1);

    if (!existing) {
      return err("NOT_FOUND", "Product not found.");
    }

    const mediaResult = await persistProductMedia({
      productId: existing.id,
      files: [file],
      primaryNewIndex: formData.get("isPrimary") === "1" ? 0 : null,
      primaryExistingId: null,
      removeImageIds: [],
    });
    if (mediaResult.error) {
      return err("VALIDATION_ERROR", mediaResult.error);
    }

    revalidatePath(`/${locale}/admin/products`);
    invalidateProductsCache({ productId: existing.id });
    return ok({ id: existing.id });
  } catch (error) {
    if (isNavigationControlError(error)) throw error;
    logger.error("products.attach_media_failed", {
      productId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return err("PRODUCT_MEDIA_FAILED", productWriteErrorMessage(error));
  }
}

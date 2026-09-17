"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db/client";
import {
  products,
  stockMovements,
  type TranslationsJson,
} from "@/db/schema";
import { persistProductMedia } from "@/features/products/application/persist-product-media";
import {
  summarizeVariableProduct,
  syncProductVariants,
} from "@/features/products/application/sync-product-variants";
import {
  syncProductBrands,
  syncProductCategories,
} from "@/features/products/application/sync-product-relations";
import { parseProductTags } from "@/features/products/domain/product-presentation";
import { allocateUniqueProductSlug } from "@/features/products/application/allocate-product-slug";
import { parseProductSpecs } from "@/features/products/domain/product-specs";
import {
  DEFAULT_PRODUCT_STOCK,
  PRODUCT_RESTOCK_AT,
} from "@/features/products/domain/product-stock";
import { compareAtFromVariantDiscount } from "@/features/products/domain/variant-discount";
import {
  productUpsertSchema,
  type ProductUpsertInput,
} from "@/features/products/schemas/product-drawer";
import { requireAdmin } from "@/lib/auth/policies";
import { invalidateProductsCache } from "@/lib/cache/invalidate-public";
import { createId } from "@/lib/id";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { err, ok, type Result } from "@/lib/result";
import {
  htmlToPlainText,
  sanitizeProductShortHtml,
} from "@/lib/sanitize/html";

function buildTranslations(data: ProductUpsertInput): TranslationsJson {
  const sanitized = data.description
    ? sanitizeProductShortHtml(data.description)
    : "";
  const description = htmlToPlainText(sanitized) ? sanitized : undefined;
  const specifications = parseProductSpecs(data.specifications).map((row) => ({
    title: row.title,
    value: row.value,
  }));
  const entry = {
    title: data.title,
    slug: data.slug,
    description,
    specifications: specifications.length > 0 ? specifications : undefined,
  };
  return { hy: entry, en: entry, ru: entry };
}

function revalidateProducts(
  locale: string,
  product: { id: string; slug: string; previousSlug?: string },
): void {
  revalidatePath(`/${locale}/admin/products`);
  revalidatePath(`/${locale}/products`);
  for (const loc of locales) {
    revalidatePath(`/${loc}`);
  }
  invalidateProductsCache({
    productId: product.id,
    slug: product.slug,
  });
  if (product.previousSlug && product.previousSlug !== product.slug) {
    invalidateProductsCache({ slug: product.previousSlug });
  }
}

function parsePayload(
  formData: FormData,
): { data: ProductUpsertInput } | { error: string } {
  const raw = formData.get("data");
  if (typeof raw !== "string") {
    return { error: "Invalid product payload." };
  }
  try {
    const parsed = productUpsertSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      if (!issue) return { error: "Invalid product payload." };
      const path = issue.path.length > 0 ? issue.path.join(".") : "payload";
      return { error: `${path}: ${issue.message}` };
    }
    return { data: parsed.data };
  } catch {
    return { error: "Invalid product payload." };
  }
}

function collectImageFiles(formData: FormData): File[] {
  return formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

function normalizeProductPayload(data: ProductUpsertInput): ProductUpsertInput {
  if (data.productType !== "VARIABLE") {
    return data;
  }

  const variants = data.variants.map((variant) => ({
    ...variant,
    compareAtAmount: compareAtFromVariantDiscount(
      variant.priceAmount,
      variant.discountValue > 0 ? variant.discountType : null,
      variant.discountValue,
    ),
  }));
  const summary = summarizeVariableProduct(variants, data.slug);

  return {
    ...data,
    variants,
    sku: summary.sku,
    priceAmount: summary.priceAmount,
    compareAtAmount: null,
  };
}

/** Creates a product from the admin drawer (fields + optional images). */
export async function createProductFromDrawerAction(
  locale: string,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const parsed = parsePayload(formData);
  if ("error" in parsed) {
    return err("VALIDATION_ERROR", parsed.error);
  }
  const uniqueSlug = await allocateUniqueProductSlug(parsed.data.slug);
  const data = normalizeProductPayload({ ...parsed.data, slug: uniqueSlug });

  if (
    data.compareAtAmount != null &&
    data.compareAtAmount < data.priceAmount
  ) {
    return err(
      "VALIDATION_ERROR",
      "Compare-at price must be greater than or equal to price.",
    );
  }

  const actor = await requireAdmin(locale as Locale);
  const id = createId();
  const files = collectImageFiles(formData);
  const initialStock =
    data.productType === "VARIABLE"
      ? data.variants.length * DEFAULT_PRODUCT_STOCK
      : DEFAULT_PRODUCT_STOCK;

  await getDb().insert(products).values({
    id,
    sku: data.sku,
    priceAmount: data.priceAmount,
    compareAtAmount: data.compareAtAmount,
    stockOnHand: initialStock,
    lowStockThreshold: PRODUCT_RESTOCK_AT,
    status: data.status,
    salesClass: data.salesClass,
    productType: data.productType,
    warrantyYears: data.warrantyYears,
    tags: parseProductTags(data.tags),
    attributeValueIds:
      data.productType === "SIMPLE" ? data.attributeValueIds : [],
    translations: buildTranslations(data),
  });

  const variantError = await syncProductVariants(id, data, formData);
  if (variantError) {
    return err("VALIDATION_ERROR", variantError);
  }

  const categoryError = await syncProductCategories(id, data.categoryIds);
  if (categoryError) {
    return err("VALIDATION_ERROR", categoryError);
  }

  const brandError = await syncProductBrands(id, data.brandIds);
  if (brandError) {
    return err("VALIDATION_ERROR", brandError);
  }

  await getDb().insert(stockMovements).values({
    id: createId(),
    productId: id,
    delta: initialStock,
    reason: "ADMIN_ADJUSTMENT",
    actorUserId: actor.id,
    resultingBalance: initialStock,
  });

  const mediaResult = await persistProductMedia({
    productId: id,
    files,
    primaryNewIndex: data.primaryNewIndex ?? (files.length > 0 ? 0 : null),
    primaryExistingId: null,
    removeImageIds: [],
  });
  if (mediaResult.error) {
    return err("VALIDATION_ERROR", mediaResult.error);
  }

  revalidateProducts(locale, { id, slug: data.slug });
  return ok({ id });
}

/** Updates a product from the admin drawer (fields + optional images). */
export async function updateProductFromDrawerAction(
  locale: string,
  productId: string,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const parsed = parsePayload(formData);
  if ("error" in parsed) {
    return err("VALIDATION_ERROR", parsed.error);
  }

  await requireAdmin(locale as Locale);
  const files = collectImageFiles(formData);

  const [existing] = await getDb()
    .select({
      id: products.id,
      status: products.status,
      translations: products.translations,
    })
    .from(products)
    .where(and(eq(products.id, productId), isNull(products.deletedAt)))
    .limit(1);

  if (!existing) {
    return err("NOT_FOUND", "Product not found.");
  }

  const uniqueSlug = await allocateUniqueProductSlug(
    parsed.data.slug,
    existing.id,
  );
  const data = normalizeProductPayload({ ...parsed.data, slug: uniqueSlug });

  if (
    data.compareAtAmount != null &&
    data.compareAtAmount < data.priceAmount
  ) {
    return err(
      "VALIDATION_ERROR",
      "Compare-at price must be greater than or equal to price.",
    );
  }

  await getDb()
    .update(products)
    .set({
      sku: data.sku,
      priceAmount: data.priceAmount,
      compareAtAmount: data.compareAtAmount,
      status: data.status || existing.status,
      salesClass: data.salesClass,
      productType: data.productType,
      warrantyYears: data.warrantyYears,
      tags: parseProductTags(data.tags),
      attributeValueIds:
        data.productType === "SIMPLE" ? data.attributeValueIds : [],
      translations: buildTranslations(data),
      updatedAt: new Date(),
    })
    .where(eq(products.id, existing.id));

  const variantError = await syncProductVariants(existing.id, data, formData);
  if (variantError) {
    return err("VALIDATION_ERROR", variantError);
  }

  const categoryError = await syncProductCategories(
    existing.id,
    data.categoryIds,
  );
  if (categoryError) {
    return err("VALIDATION_ERROR", categoryError);
  }

  const brandError = await syncProductBrands(existing.id, data.brandIds);
  if (brandError) {
    return err("VALIDATION_ERROR", brandError);
  }

  const mediaResult = await persistProductMedia({
    productId: existing.id,
    files,
    primaryNewIndex: data.primaryNewIndex ?? null,
    primaryExistingId: data.primaryExistingId ?? null,
    removeImageIds: data.removeImageIds,
  });
  if (mediaResult.error) {
    return err("VALIDATION_ERROR", mediaResult.error);
  }

  const previousSlug =
    existing.translations.hy?.slug ??
    existing.translations.en?.slug ??
    existing.translations.ru?.slug;

  revalidateProducts(locale, {
    id: existing.id,
    slug: data.slug,
    previousSlug,
  });
  return ok({ id: existing.id });
}

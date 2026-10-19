"use server";

import { and, eq, isNull, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/db/client";
import { categories, type TranslationsJson } from "@/db/schema";
import {
  persistCategoryBannerImage,
  persistCategoryImage,
  removeCategoryBannerImage,
  removeCategoryImage,
} from "@/features/categories/application/persist-category-media";
import { categoryIdSchema } from "@/features/categories/domain/category-id";
import { isInvalidCategoryParent } from "@/features/categories/domain/category-tree";
import { requireAdmin } from "@/lib/auth/policies";
import { invalidateProductsCache } from "@/lib/cache/invalidate-public";
import { createId } from "@/lib/id";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { err, ok, type Result } from "@/lib/result";

const localeCopySchema = z.object({
  title: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(120),
  drawerTitle: z.string().trim().max(200).optional(),
});

const createCategorySchema = z.object({
  title: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(120),
  parentId: categoryIdSchema.nullable(),
  status: z.enum(["ACTIVE", "ARCHIVED"]),
});

const drawerFieldsSchema = z.object({
  translations: z
    .object({
      hy: localeCopySchema.optional(),
      en: localeCopySchema.optional(),
      ru: localeCopySchema.optional(),
    })
    .refine((value) => Boolean(value.hy ?? value.en ?? value.ru)),
  parentId: categoryIdSchema.nullable(),
  status: z.enum(["ACTIVE", "ARCHIVED"]),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

function buildTranslations(title: string, slug: string): TranslationsJson {
  const translation = { title, slug };
  return { hy: translation, en: translation, ru: translation };
}

function isCategorySlugUniqueViolation(error: unknown): boolean {
  const queue: unknown[] = [error];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    if (current instanceof Error) {
      if (
        current.message.includes("categories_slug_") ||
        current.message.includes("duplicate key")
      ) {
        return true;
      }
    }

    if (typeof current !== "object") continue;
    const value = current as {
      code?: unknown;
      constraint?: unknown;
      detail?: unknown;
      message?: unknown;
      cause?: unknown;
    };

    if (
      value.code === "23505" &&
      typeof value.constraint === "string" &&
      value.constraint.includes("categories_slug_")
    ) {
      return true;
    }
    if (
      typeof value.detail === "string" &&
      value.detail.includes("already exists")
    ) {
      return true;
    }
    if (
      typeof value.message === "string" &&
      (value.message.includes("categories_slug_") ||
        value.message.includes("duplicate key"))
    ) {
      return true;
    }
    if (value.cause) queue.push(value.cause);
  }

  return false;
}

function isCategoryParentForeignKeyViolation(error: unknown): boolean {
  const queue: unknown[] = [error];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    if (current instanceof Error) {
      if (
        current.message.includes("categories_parent_id_fkey") ||
        current.message.includes("foreign key constraint")
      ) {
        return true;
      }
    }

    if (typeof current !== "object") continue;
    const value = current as {
      code?: unknown;
      constraint?: unknown;
      message?: unknown;
      cause?: unknown;
    };

    if (
      value.code === "23503" &&
      value.constraint === "categories_parent_id_fkey"
    ) {
      return true;
    }
    if (
      typeof value.message === "string" &&
      (value.message.includes("categories_parent_id_fkey") ||
        value.message.includes("foreign key constraint"))
    ) {
      return true;
    }
    if (value.cause) queue.push(value.cause);
  }

  return false;
}

function revalidateCategories(locale: string): void {
  revalidatePath(`/${locale}/admin/categories`);
  revalidatePath(`/${locale}/admin/products`);
  revalidatePath(`/${locale}/products`);
  invalidateProductsCache({ allProductDetails: true });
}

function parseParentId(formData: FormData): string | null {
  const rawParent = formData.get("parentId");
  if (typeof rawParent !== "string" || !rawParent.trim()) return null;
  return rawParent.trim();
}

function parseDrawerPayload(formData: FormData) {
  const rawTranslations = formData.get("translations");
  if (typeof rawTranslations !== "string") return null;
  try {
    return drawerFieldsSchema.safeParse({
      translations: JSON.parse(rawTranslations),
      parentId: parseParentId(formData),
      status: formData.get("status"),
    });
  } catch {
    return null;
  }
}

async function loadCategoryLinks() {
  return getDb()
    .select({ id: categories.id, parentId: categories.parentId })
    .from(categories)
    .where(isNull(categories.deletedAt));
}

async function assertParent(
  parentId: string | null,
  categoryId?: string,
): Promise<Result<true>> {
  if (!parentId) return ok(true);

  const links = await loadCategoryLinks();
  if (!links.some((row) => row.id === parentId)) {
    return err("NOT_FOUND", "Parent category not found.");
  }
  if (categoryId && isInvalidCategoryParent(categoryId, parentId, links)) {
    return err(
      "VALIDATION_ERROR",
      "A category cannot be nested under itself or its descendant.",
    );
  }
  return ok(true);
}

async function nextSortOrder(parentId: string | null): Promise<number> {
  const [maxSort] = await getDb()
    .select({ value: max(categories.sortOrder) })
    .from(categories)
    .where(
      and(
        isNull(categories.deletedAt),
        parentId
          ? eq(categories.parentId, parentId)
          : isNull(categories.parentId),
      ),
    );
  return (maxSort?.value ?? 0) + 1;
}

async function insertCategory(
  locale: Locale,
  data: {
    translations: TranslationsJson;
    parentId: string | null;
    status: "ACTIVE" | "ARCHIVED";
  },
): Promise<Result<{ id: string }>> {
  const parentCheck = await assertParent(data.parentId);
  if (!parentCheck.ok) return parentCheck;

  const id = createId();
  try {
    await getDb().insert(categories).values({
      id,
      parentId: data.parentId,
      translations: data.translations,
      sortOrder: await nextSortOrder(data.parentId),
      status: data.status,
    });
  } catch (error) {
    if (isCategorySlugUniqueViolation(error)) {
      return err("SLUG_TAKEN", "Category slug is already in use.");
    }
    if (isCategoryParentForeignKeyViolation(error)) {
      return err("NOT_FOUND", "Parent category not found.");
    }
    return err("CATEGORY_CREATE_FAILED", "Unable to create category.");
  }

  revalidateCategories(locale);
  return ok({ id });
}

/** Creates a category for the admin catalog. */
export async function createCategoryAction(
  locale: string,
  raw: CreateCategoryInput,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const parsed = createCategorySchema.safeParse(raw);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", "Invalid category payload.");
  }

  await requireAdmin(locale as Locale);
  return insertCategory(locale, {
    translations: buildTranslations(parsed.data.title, parsed.data.slug),
    parentId: parsed.data.parentId,
    status: parsed.data.status,
  });
}

async function persistDrawerImage(
  locale: Locale,
  categoryId: string,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  const image = formData.get("image");
  const removeImage = formData.get("removeImage") === "1";
  const bannerImage = formData.get("bannerImage");
  const removeBannerImage = formData.get("removeBannerImage") === "1";

  if (image instanceof File && image.size > 0) {
    const mediaResult = await persistCategoryImage(categoryId, image);
    if (mediaResult.error) {
      return err("VALIDATION_ERROR", mediaResult.error);
    }
  } else if (removeImage) {
    await removeCategoryImage(categoryId);
  }

  if (bannerImage instanceof File && bannerImage.size > 0) {
    const mediaResult = await persistCategoryBannerImage(categoryId, bannerImage);
    if (mediaResult.error) {
      return err("VALIDATION_ERROR", mediaResult.error);
    }
  } else if (removeBannerImage) {
    await removeCategoryBannerImage(categoryId);
  }

  revalidateCategories(locale);
  return ok({ id: categoryId });
}

/** Creates a category from the admin drawer (fields + optional image). */
export async function createCategoryFromDrawerAction(
  locale: string,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const parsed = parseDrawerPayload(formData);
  if (!parsed?.success) {
    return err("VALIDATION_ERROR", "Invalid category payload.");
  }

  await requireAdmin(locale as Locale);
  const created = await insertCategory(locale, parsed.data);
  if (!created.ok) return created;
  return persistDrawerImage(locale, created.value.id, formData);
}

/** Updates a category from the admin drawer (fields + optional image). */
export async function updateCategoryFromDrawerAction(
  locale: string,
  categoryId: string,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const parsed = parseDrawerPayload(formData);
  if (!parsed?.success) {
    return err("VALIDATION_ERROR", "Invalid category payload.");
  }

  await requireAdmin(locale as Locale);

  const [existing] = await getDb()
    .select({
      id: categories.id,
      translations: categories.translations,
    })
    .from(categories)
    .where(and(eq(categories.id, categoryId), isNull(categories.deletedAt)))
    .limit(1);

  if (!existing) {
    return err("NOT_FOUND", "Category not found.");
  }

  const parentCheck = await assertParent(parsed.data.parentId, existing.id);
  if (!parentCheck.ok) return parentCheck;

  try {
    await getDb()
      .update(categories)
      .set({
        parentId: parsed.data.parentId,
        translations: {
          ...existing.translations,
          ...parsed.data.translations,
        },
        status: parsed.data.status,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, existing.id));
  } catch (error) {
    if (isCategorySlugUniqueViolation(error)) {
      return err("SLUG_TAKEN", "Category slug is already in use.");
    }
    if (isCategoryParentForeignKeyViolation(error)) {
      return err("NOT_FOUND", "Parent category not found.");
    }
    return err("CATEGORY_UPDATE_FAILED", "Unable to update category.");
  }

  return persistDrawerImage(locale, existing.id, formData);
}

/** Soft-deletes a category. */
export async function deleteCategoryAction(
  locale: string,
  categoryId: string,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  await requireAdmin(locale as Locale);

  const [updated] = await getDb()
    .update(categories)
    .set({
      deletedAt: new Date(),
      status: "ARCHIVED",
      updatedAt: new Date(),
    })
    .where(and(eq(categories.id, categoryId), isNull(categories.deletedAt)))
    .returning({ id: categories.id });

  if (!updated) {
    return err("NOT_FOUND", "Category not found.");
  }

  revalidateCategories(locale);
  return ok({ id: updated.id });
}

const reorderCategoriesSchema = z.object({
  orderedIds: z.array(categoryIdSchema).min(1),
});

/** Persists admin category table order via sortOrder (1-based). */
export async function reorderCategoriesAction(
  locale: string,
  raw: z.infer<typeof reorderCategoriesSchema>,
): Promise<Result<{ updated: number }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const parsed = reorderCategoriesSchema.safeParse(raw);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", "Invalid category order.");
  }

  await requireAdmin(locale as Locale);

  const uniqueIds = [...new Set(parsed.data.orderedIds)];
  if (uniqueIds.length !== parsed.data.orderedIds.length) {
    return err("VALIDATION_ERROR", "Duplicate category ids in order.");
  }

  const existing = await getDb()
    .select({ id: categories.id })
    .from(categories)
    .where(and(isNull(categories.deletedAt)));

  if (existing.length !== uniqueIds.length) {
    return err(
      "VALIDATION_ERROR",
      "Category list is out of date. Refresh and try again.",
    );
  }

  const existingSet = new Set(existing.map((row) => row.id));
  for (const id of uniqueIds) {
    if (!existingSet.has(id)) {
      return err("NOT_FOUND", "Category not found.");
    }
  }

  const now = new Date();
  await Promise.all(
    uniqueIds.map((id, index) =>
      getDb()
        .update(categories)
        .set({ sortOrder: index + 1, updatedAt: now })
        .where(eq(categories.id, id)),
    ),
  );

  revalidateCategories(locale);
  return ok({ updated: uniqueIds.length });
}

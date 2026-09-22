import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  isNull,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  categories,
  mediaAssets,
  productCategories,
  products,
  type LocaleTranslation,
  type ProductTag,
  type ProductWarrantyYears,
} from "@/db/schema";
import { loadProductBrandIds } from "@/features/products/application/load-product-brand-logos";
import { loadProductImagesForAdmin } from "@/features/products/application/persist-product-media";
import {
  isProductSalesClass,
  isProductWarrantyYears,
  parseProductTags,
  type ProductSalesClass,
} from "@/features/products/domain/product-presentation";
import {
  parseProductSpecs,
  type ProductSpecification,
} from "@/features/products/domain/product-specs";
import type { AdminProductsFilter } from "@/features/products/schemas/admin-list";
import type { Locale } from "@/lib/i18n/config";
import { mediaPublicUrl } from "@/lib/media/public-url";

const PAGE_SIZE = 20;

export type AdminProductImage = {
  id: string;
  url: string;
  isPrimary: boolean;
};

export type AdminProductListItem = {
  id: string;
  sku: string;
  status: string;
  productType: "SIMPLE" | "VARIABLE";
  priceAmount: number;
  compareAtAmount: number | null;
  stockOnHand: number;
  isFeatured: boolean;
  salesClass: ProductSalesClass;
  warrantyYears: ProductWarrantyYears;
  tags: ProductTag[];
  createdAt: Date;
  title: string;
  slug: string;
  description: string;
  specifications: ProductSpecification[];
  imageUrl: string | null;
  categoryIds: string[];
  brandIds: string[];
  categoryLabels: string[];
  images: AdminProductImage[];
};

export type AdminCategoryOption = {
  id: string;
  title: string;
  parentId: string | null;
};

function translationFor(
  translations: (typeof products.$inferSelect)["translations"],
  locale: Locale,
): LocaleTranslation | null {
  return translations[locale] ?? translations.hy ?? translations.en ?? null;
}

function buildWhere(filters: AdminProductsFilter, locale: Locale): SQL | undefined {
  const conditions: SQL[] = [isNull(products.deletedAt)];

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    conditions.push(
      or(
        sql`${products.translations}->${locale}->>'title' ILIKE ${pattern}`,
        sql`${products.translations}->${locale}->>'slug' ILIKE ${pattern}`,
        sql`${products.translations}->'hy'->>'title' ILIKE ${pattern}`,
        sql`${products.translations}->'hy'->>'slug' ILIKE ${pattern}`,
        ilike(products.sku, pattern),
      )!,
    );
  }

  if (filters.sku) {
    conditions.push(ilike(products.sku, `%${filters.sku}%`));
  }

  if (filters.published === "published") {
    conditions.push(eq(products.status, "ACTIVE"));
  } else if (filters.published === "unpublished") {
    conditions.push(inArray(products.status, ["DRAFT", "ARCHIVED"]));
  }

  if (filters.stock === "in_stock") {
    conditions.push(gt(products.stockOnHand, 0));
  } else if (filters.stock === "out_of_stock") {
    conditions.push(eq(products.stockOnHand, 0));
  } else if (filters.stock === "low_stock") {
    conditions.push(
      and(gt(products.stockOnHand, 0), lte(products.stockOnHand, products.lowStockThreshold))!,
    );
  }

  if (filters.categoryId) {
    conditions.push(
      sql`exists (
        select 1 from ${productCategories}
        where ${productCategories.productId} = ${products.id}
          and ${productCategories.categoryId} = ${filters.categoryId}
      )`,
    );
  }

  return and(...conditions);
}

/** Drafts always sort after non-drafts; secondary key is the user-selected column. */
function orderByClause(filters: AdminProductsFilter, locale: Locale): SQL[] {
  const direction = filters.dir === "asc" ? asc : desc;
  const draftsLast = sql`CASE WHEN ${products.status} = 'DRAFT' THEN 1 ELSE 0 END`;
  switch (filters.sort) {
    case "stock":
      return [draftsLast, direction(products.stockOnHand)];
    case "price":
      return [draftsLast, direction(products.priceAmount)];
    case "title":
      return [
        draftsLast,
        direction(sql`${products.translations}->${locale}->>'title'`),
      ];
    case "created":
    default:
      return [draftsLast, direction(products.createdAt)];
  }
}

async function loadPrimaryImages(
  productIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (productIds.length === 0) return map;

  const rows = await getDb()
    .select({
      productId: mediaAssets.productId,
      objectKey: mediaAssets.objectKey,
    })
    .from(mediaAssets)
    .where(
      and(
        inArray(mediaAssets.productId, productIds),
        eq(mediaAssets.uploadStatus, "READY"),
        or(eq(mediaAssets.isPrimary, true), eq(mediaAssets.role, "PRIMARY")),
      ),
    )
    .orderBy(asc(mediaAssets.sortOrder));

  for (const row of rows) {
    if (!row.productId || map.has(row.productId)) continue;
    map.set(row.productId, mediaPublicUrl(row.objectKey));
  }
  return map;
}

async function loadCategoryMeta(
  productIds: string[],
  locale: Locale,
): Promise<Map<string, { ids: string[]; labels: string[] }>> {
  const map = new Map<string, { ids: string[]; labels: string[] }>();
  if (productIds.length === 0) return map;

  const rows = await getDb()
    .select({
      productId: productCategories.productId,
      categoryId: productCategories.categoryId,
      translations: categories.translations,
      sortOrder: productCategories.sortOrder,
    })
    .from(productCategories)
    .innerJoin(categories, eq(categories.id, productCategories.categoryId))
    .where(inArray(productCategories.productId, productIds))
    .orderBy(asc(productCategories.sortOrder));

  for (const row of rows) {
    const title =
      translationFor(row.translations, locale)?.title ??
      row.translations.hy?.title ??
      "Category";
    const entry = map.get(row.productId) ?? { ids: [], labels: [] };
    entry.ids.push(row.categoryId);
    entry.labels.push(title);
    map.set(row.productId, entry);
  }
  return map;
}

/** Lists products for the admin catalog table with filters and sort. */
export async function listAdminProducts(
  locale: Locale,
  filters: AdminProductsFilter,
): Promise<{ rows: AdminProductListItem[]; total: number; pageSize: number }> {
  const where = buildWhere(filters, locale);
  const db = getDb();

  const [totalRow] = await db
    .select({ value: count() })
    .from(products)
    .where(where);

  const total = totalRow?.value ?? 0;
  const offset = (filters.page - 1) * PAGE_SIZE;

  const rows = await db
    .select()
    .from(products)
    .where(where)
    .orderBy(...orderByClause(filters, locale))
    .limit(PAGE_SIZE)
    .offset(offset);

  const ids = rows.map((row) => row.id);
  const [primaryImages, categoryMap, brandMap, galleryImages] =
    await Promise.all([
      loadPrimaryImages(ids),
      loadCategoryMeta(ids, locale),
      loadProductBrandIds(ids),
      loadProductImagesForAdmin(ids),
    ]);

  return {
    total,
    pageSize: PAGE_SIZE,
    rows: rows.map((product) => {
      const translation = translationFor(product.translations, locale);
      const categoryMeta = categoryMap.get(product.id);
      return {
        id: product.id,
        sku: product.sku,
        status: product.status,
        productType: product.productType === "VARIABLE" ? "VARIABLE" : "SIMPLE",
        priceAmount: product.priceAmount,
        compareAtAmount: product.compareAtAmount,
        stockOnHand: product.stockOnHand,
        isFeatured: product.isFeatured,
        salesClass: isProductSalesClass(product.salesClass)
          ? product.salesClass
          : "RETAIL",
        warrantyYears: isProductWarrantyYears(product.warrantyYears)
          ? product.warrantyYears
          : 0,
        tags: parseProductTags(product.tags),
        createdAt: product.createdAt,
        title: translation?.title ?? product.sku,
        slug: translation?.slug ?? "",
        description: translation?.description ?? "",
        specifications: parseProductSpecs(translation?.specifications),
        imageUrl: primaryImages.get(product.id) ?? null,
        categoryIds: categoryMeta?.ids ?? [],
        brandIds: brandMap.get(product.id) ?? [],
        categoryLabels: categoryMeta?.labels ?? [],
        images: galleryImages.get(product.id) ?? [],
      };
    }),
  };
}

/** Active categories for the admin products filter dropdown. */
export async function listAdminCategoryOptions(
  locale: Locale,
): Promise<AdminCategoryOption[]> {
  const rows = await getDb()
    .select()
    .from(categories)
    .where(and(eq(categories.status, "ACTIVE"), isNull(categories.deletedAt)))
    .orderBy(asc(categories.sortOrder));

  return rows.map((row) => ({
    id: row.id,
    title: translationFor(row.translations, locale)?.title ?? "Category",
    parentId: row.parentId,
  }));
}

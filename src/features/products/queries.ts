import "server-only";

import { and, asc, desc, eq, gt, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { getDb } from "@/db/client";
import {
  categories,
  mediaAssets,
  productBrands,
  productCategories,
  productVariantAttributeValues,
  productVariants,
  products,
} from "@/db/schema";
import { loadProductBrandMarks } from "@/features/products/application/load-product-brand-logos";
import { parseProductTags } from "@/features/products/domain/product-presentation";
import type {
  CatalogPricePresence,
  CatalogSort,
} from "@/features/products/domain/catalog-sort";
import { toIlikeContainsPattern } from "@/features/products/domain/catalog-text-search";
import { parseProductSpecs } from "@/features/products/domain/product-specs";
import { resolveProductPrices } from "@/features/promotions/application/resolve-product-prices";
import type {
  CatalogProduct,
  ProductCategoryRef,
  ProductDetail,
  ProductGalleryImage,
} from "@/features/products/types";
import {
  CACHE_TAGS,
  PUBLIC_CACHE_REVALIDATE_SECONDS,
} from "@/lib/cache/tags";
import type { Locale } from "@/lib/i18n/config";
import { mediaPublicUrl } from "@/lib/media/public-url";

export type {
  CatalogProduct,
  ProductCategoryRef,
  ProductDetail,
  ProductGalleryImage,
} from "@/features/products/types";

const RELATED_PRODUCTS_LIMIT = 4;
export const CATALOG_PAGE_SIZE = 24;
export const HOME_NEW_PRODUCTS_LIMIT = 8;

function toCatalogProduct(
  product: typeof products.$inferSelect,
  locale: Locale,
  imageUrl: string | null = null,
): Omit<
  CatalogProduct,
  "priceAmount" | "compareAtAmount" | "discountPercent" | "listPriceAmount"
> | null {
  const translation = product.translations[locale] ?? product.translations.hy;
  if (!translation) {
    return null;
  }

  return {
    id: product.id,
    sku: product.sku,
    stockOnHand: product.stockOnHand,
    translation: {
      ...translation,
      specifications: parseProductSpecs(translation.specifications).map(
        (row) => ({ title: row.title, value: row.value }),
      ),
    },
    imageUrl,
    brandLogoUrl: null,
    brandName: null,
    warrantyYears: product.warrantyYears,
    tags: parseProductTags(product.tags),
  };
}

async function loadPrimaryProductImages(
  productIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (productIds.length === 0) {
    return map;
  }

  const rows = await getDb()
    .select({
      productId: mediaAssets.productId,
      objectKey: mediaAssets.objectKey,
      isPrimary: mediaAssets.isPrimary,
      role: mediaAssets.role,
      sortOrder: mediaAssets.sortOrder,
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
    if (!row.productId || map.has(row.productId)) {
      continue;
    }
    map.set(row.productId, mediaPublicUrl(row.objectKey));
  }

  return map;
}

async function withProductImages(
  rows: Array<typeof products.$inferSelect>,
  locale: Locale,
): Promise<CatalogProduct[]> {
  const productIds = rows.map((row) => row.id);
  const [images, prices, brandMarks] = await Promise.all([
    loadPrimaryProductImages(productIds),
    resolveProductPrices(
      rows.map((row) => ({
        id: row.id,
        priceAmount: row.priceAmount,
        compareAtAmount: row.compareAtAmount,
      })),
    ),
    loadProductBrandMarks(productIds, locale),
  ]);

  return rows
    .map((product) => {
      const base = toCatalogProduct(
        product,
        locale,
        images.get(product.id) ?? null,
      );
      if (!base) return null;

      const resolved = prices.get(product.id);
      const brand = brandMarks.get(product.id);
      return {
        ...base,
        brandLogoUrl: brand?.logoUrl ?? null,
        brandName: brand?.name ?? null,
        listPriceAmount: resolved?.listAmount ?? product.priceAmount,
        priceAmount: resolved?.unitAmount ?? product.priceAmount,
        compareAtAmount: resolved?.compareAtAmount ?? null,
        discountPercent: resolved?.discountPercent ?? null,
      } satisfies CatalogProduct;
    })
    .filter((product): product is CatalogProduct => product !== null);
}

const activeCatalogWhere = and(
  eq(products.status, "ACTIVE"),
  isNull(products.deletedAt),
);

export type CatalogListFilter = {
  /** Normalized free-text query (title + product/variant SKU). */
  q?: string;
  categoryIds?: readonly string[];
  brandIds?: readonly string[];
  /** Attribute value id groups: AND across groups, OR within a group. */
  attributeValueIdGroups?: readonly (readonly string[])[];
  minPriceAmd?: number;
  maxPriceAmd?: number;
  sort?: CatalogSort;
  pricePresence?: CatalogPricePresence;
};

function catalogTitleMatchesQuery(pattern: string) {
  return or(
    sql`${products.translations}->'hy'->>'title' ILIKE ${pattern} ESCAPE '\\'`,
    sql`${products.translations}->'en'->>'title' ILIKE ${pattern} ESCAPE '\\'`,
    sql`${products.translations}->'ru'->>'title' ILIKE ${pattern} ESCAPE '\\'`,
  )!;
}

function catalogTextSearchWhere(query: string) {
  const pattern = toIlikeContainsPattern(query);
  const variantSkuMatch = inArray(
    products.id,
    getDb()
      .select({ id: productVariants.productId })
      .from(productVariants)
      .where(sql`${productVariants.sku} ILIKE ${pattern} ESCAPE '\\'`),
  );
  return or(
    catalogTitleMatchesQuery(pattern),
    sql`${products.sku} ILIKE ${pattern} ESCAPE '\\'`,
    variantSkuMatch,
  )!;
}

function catalogTitleOrderExpr(locale: Locale) {
  if (locale === "en") return sql`${products.translations}->'en'->>'title'`;
  if (locale === "ru") return sql`${products.translations}->'ru'->>'title'`;
  return sql`${products.translations}->'hy'->>'title'`;
}

function catalogOrderBy(locale: Locale, sort?: CatalogSort) {
  switch (sort) {
    case "price-asc":
      return asc(products.priceAmount);
    case "price-desc":
      return desc(products.priceAmount);
    case "name-asc":
      return asc(catalogTitleOrderExpr(locale));
    case "name-desc":
      return desc(catalogTitleOrderExpr(locale));
    default:
      return desc(products.createdAt);
  }
}

function productMatchesAnyAttributeValueIds(valueIds: readonly string[]) {
  const ids = [...valueIds];
  const onSimple = or(
    ...ids.map(
      (id) =>
        sql`${products.attributeValueIds} @> ${JSON.stringify([id])}::jsonb`,
    ),
  )!;
  const onVariant = inArray(
    products.id,
    getDb()
      .select({ id: productVariants.productId })
      .from(productVariants)
      .innerJoin(
        productVariantAttributeValues,
        eq(productVariantAttributeValues.variantId, productVariants.id),
      )
      .where(inArray(productVariantAttributeValues.attributeValueId, ids)),
  );
  return or(onSimple, onVariant)!;
}

/** SQL predicate for the active storefront catalog list. */
export function catalogListWhere(filter?: CatalogListFilter) {
  const conditions = [activeCatalogWhere];
  if (filter?.q) {
    conditions.push(catalogTextSearchWhere(filter.q));
  }
  if (filter?.categoryIds && filter.categoryIds.length > 0) {
    conditions.push(
      inArray(
        products.id,
        getDb()
          .select({ id: productCategories.productId })
          .from(productCategories)
          .where(
            inArray(productCategories.categoryId, [...filter.categoryIds]),
          ),
      ),
    );
  }
  if (filter?.brandIds && filter.brandIds.length > 0) {
    conditions.push(
      inArray(
        products.id,
        getDb()
          .select({ id: productBrands.productId })
          .from(productBrands)
          .where(inArray(productBrands.brandId, [...filter.brandIds])),
      ),
    );
  }
  if (filter?.attributeValueIdGroups) {
    for (const group of filter.attributeValueIdGroups) {
      if (group.length === 0) continue;
      conditions.push(productMatchesAnyAttributeValueIds(group));
    }
  }
  if (filter?.minPriceAmd != null) {
    conditions.push(gte(products.priceAmount, filter.minPriceAmd));
  }
  if (filter?.maxPriceAmd != null) {
    conditions.push(lte(products.priceAmount, filter.maxPriceAmd));
  }
  if (filter?.pricePresence === "without") {
    conditions.push(eq(products.priceAmount, 0));
  } else if (filter?.pricePresence === "with") {
    conditions.push(gt(products.priceAmount, 0));
  }
  return and(...conditions);
}

/** Stable cache key for catalog list filters. */
export function catalogFilterCacheKey(filter?: CatalogListFilter): string {
  if (!filter) return "";
  const categoryKey = [...(filter.categoryIds ?? [])].sort().join(",");
  const brandKey = [...(filter.brandIds ?? [])].sort().join(",");
  const attributeKey = (filter.attributeValueIdGroups ?? [])
    .map((group) => [...group].sort().join("+"))
    .sort()
    .join("|");
  return [
    filter.q ?? "",
    categoryKey,
    brandKey,
    attributeKey,
    filter.minPriceAmd ?? "",
    filter.maxPriceAmd ?? "",
    filter.sort ?? "",
    filter.pricePresence ?? "",
  ].join(":");
}

/** Active products by id — used by wishlist (not shared-cache; IDs are user-specific). */
export async function getActiveProductsByIds(
  locale: Locale,
  productIds: string[],
): Promise<CatalogProduct[]> {
  if (productIds.length === 0) {
    return [];
  }

  const rows = await getDb()
    .select()
    .from(products)
    .where(and(inArray(products.id, productIds), activeCatalogWhere));

  return withProductImages(rows, locale);
}

async function loadActiveProductsPage(
  locale: Locale,
  page: number,
  filter?: CatalogListFilter,
): Promise<{ products: CatalogProduct[]; total: number; pageSize: number }> {
  const offset = (page - 1) * CATALOG_PAGE_SIZE;
  const where = catalogListWhere(filter);

  const [[countRow], rows] = await Promise.all([
    getDb()
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(where),
    getDb()
      .select()
      .from(products)
      .where(where)
      .orderBy(catalogOrderBy(locale, filter?.sort))
      .limit(CATALOG_PAGE_SIZE)
      .offset(offset),
  ]);

  const enriched = await withProductImages(rows, locale);

  return {
    products: enriched,
    total: countRow?.count ?? 0,
    pageSize: CATALOG_PAGE_SIZE,
  };
}

/** Paginated active catalog for the storefront (tag-cached). */
export async function getActiveProductsPage(
  locale: Locale,
  page: number,
  filter?: CatalogListFilter,
): Promise<{ products: CatalogProduct[]; total: number; pageSize: number }> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;

  return unstable_cache(
    async () => loadActiveProductsPage(locale, safePage, filter),
    [
      "active-products-page",
      locale,
      String(safePage),
      catalogFilterCacheKey(filter),
    ],
    {
      tags: [CACHE_TAGS.products],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();
}

/** @deprecated Prefer getActiveProductsPage — kept for narrow internal callers. */
export async function getActiveProducts(
  locale: Locale,
): Promise<CatalogProduct[]> {
  const result = await getActiveProductsPage(locale, 1);
  if (result.total <= result.pageSize) {
    return result.products;
  }

  const rows = await getDb().select().from(products).where(activeCatalogWhere);
  return withProductImages(rows, locale);
}

async function loadFeaturedProducts(
  locale: Locale,
): Promise<CatalogProduct[]> {
  const rows = await getDb()
    .select()
    .from(products)
    .where(
      and(
        eq(products.status, "ACTIVE"),
        eq(products.isFeatured, true),
        isNull(products.deletedAt),
      ),
    )
    .limit(8);

  return withProductImages(rows, locale);
}

export async function getFeaturedProducts(
  locale: Locale,
): Promise<CatalogProduct[]> {
  return unstable_cache(
    async () => loadFeaturedProducts(locale),
    ["featured-products", locale],
    {
      tags: [CACHE_TAGS.products],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();
}

async function loadNewestProducts(locale: Locale): Promise<CatalogProduct[]> {
  const rows = await getDb()
    .select()
    .from(products)
    .where(activeCatalogWhere)
    .orderBy(desc(products.createdAt))
    .limit(HOME_NEW_PRODUCTS_LIMIT);

  return withProductImages(rows, locale);
}

/** Most recently created active products for the home new-arrivals grid. */
export async function getNewestProducts(
  locale: Locale,
): Promise<CatalogProduct[]> {
  return unstable_cache(
    async () => loadNewestProducts(locale),
    ["newest-products", locale],
    {
      tags: [CACHE_TAGS.products],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();
}

export async function getProductBySlug(
  locale: Locale,
  slug: string,
): Promise<CatalogProduct | null> {
  const [product] = await getDb()
    .select()
    .from(products)
    .where(
      and(
        eq(products.status, "ACTIVE"),
        isNull(products.deletedAt),
        sql`${products.translations}->${locale}->>'slug' = ${slug}`,
      ),
    )
    .limit(1);

  if (!product) {
    return null;
  }

  const [enriched] = await withProductImages([product], locale);
  return enriched ?? null;
}

async function loadProductGallery(
  productId: string,
  locale: Locale,
  fallbackTitle: string,
): Promise<ProductGalleryImage[]> {
  const rows = await getDb()
    .select({
      id: mediaAssets.id,
      objectKey: mediaAssets.objectKey,
      isPrimary: mediaAssets.isPrimary,
      sortOrder: mediaAssets.sortOrder,
      altTranslations: mediaAssets.altTranslations,
    })
    .from(mediaAssets)
    .where(
      and(
        eq(mediaAssets.productId, productId),
        eq(mediaAssets.uploadStatus, "READY"),
      ),
    )
    .orderBy(asc(mediaAssets.sortOrder));

  return rows
    .map((row) => ({
      id: row.id,
      url: mediaPublicUrl(row.objectKey),
      alt: row.altTranslations?.[locale] ?? fallbackTitle,
      isPrimary: row.isPrimary,
    }))
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
}

async function loadProductCategories(
  productId: string,
  locale: Locale,
): Promise<ProductCategoryRef[]> {
  const rows = await getDb()
    .select({
      id: categories.id,
      translations: categories.translations,
      isPrimary: productCategories.isPrimary,
      sortOrder: productCategories.sortOrder,
    })
    .from(productCategories)
    .innerJoin(categories, eq(productCategories.categoryId, categories.id))
    .where(
      and(
        eq(productCategories.productId, productId),
        eq(categories.status, "ACTIVE"),
        isNull(categories.deletedAt),
      ),
    )
    .orderBy(asc(productCategories.sortOrder));

  return rows
    .map((row) => {
      const translation = row.translations[locale] ?? row.translations.hy;
      if (!translation) return null;
      return {
        id: row.id,
        title: translation.title,
        slug: translation.slug,
      } satisfies ProductCategoryRef;
    })
    .filter((row): row is ProductCategoryRef => row !== null);
}

async function loadProductDetailBySlug(
  locale: Locale,
  slug: string,
): Promise<ProductDetail | null> {
  const product = await getProductBySlug(locale, slug);
  if (!product) {
    return null;
  }

  const [images, productCats] = await Promise.all([
    loadProductGallery(product.id, locale, product.translation.title),
    loadProductCategories(product.id, locale),
  ]);

  const gallery =
    images.length > 0
      ? images
      : product.imageUrl
        ? [
            {
              id: product.id,
              url: product.imageUrl,
              alt: product.translation.title,
              isPrimary: true,
            },
          ]
        : [];

  return {
    ...product,
    images: gallery,
    categories: productCats,
  };
}

/** Full PDP payload — request-deduped; tagged per-slug so edits don't bust other PDPs. */
export const getProductDetailBySlug = cache(
  async (locale: Locale, slug: string): Promise<ProductDetail | null> => {
    return unstable_cache(
      async () => loadProductDetailBySlug(locale, slug),
      ["product-detail", locale, slug],
      {
        tags: [
          CACHE_TAGS.productDetail,
          CACHE_TAGS.productSlug(locale, slug),
        ],
        revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
      },
    )();
  },
);

/** Active products sharing at least one category with the given product. */
export async function getRelatedProducts(
  locale: Locale,
  productId: string,
): Promise<CatalogProduct[]> {
  const seedCategories = getDb()
    .select({ categoryId: productCategories.categoryId })
    .from(productCategories)
    .where(eq(productCategories.productId, productId));

  const relatedLinks = await getDb()
    .selectDistinct({ productId: productCategories.productId })
    .from(productCategories)
    .where(
      and(
        inArray(productCategories.categoryId, seedCategories),
        sql`${productCategories.productId} <> ${productId}`,
      ),
    );

  const relatedIds = relatedLinks.map((row) => row.productId);
  if (relatedIds.length === 0) {
    return [];
  }

  const rows = await getDb()
    .select()
    .from(products)
    .where(and(inArray(products.id, relatedIds), activeCatalogWhere))
    .limit(RELATED_PRODUCTS_LIMIT);

  return withProductImages(rows, locale);
}

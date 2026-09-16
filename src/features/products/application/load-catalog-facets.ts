import "server-only";

import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { getDb } from "@/db/client";
import {
  attributes,
  attributeValues,
  brands,
  categories,
  productBrands,
  productCategories,
  products,
  type LocaleTranslation,
} from "@/db/schema";
import { buildCategoryTree } from "@/features/categories/domain/category-tree";
import {
  buildBrandFacetsWithCounts,
  mergeBrandFacetsByPricePresence,
} from "@/features/products/domain/catalog-brand-facet-counts";
import {
  buildCategoryFacetsWithDistinctCounts,
  mergeCategoryFacetsByPricePresence,
} from "@/features/products/domain/catalog-category-facet-counts";
import { colorFacetsFromAttributes } from "@/features/products/domain/catalog-attribute-facets";
import type {
  CatalogAttributeFacet,
  CatalogBrandFacet,
  CatalogCategoryFacet,
  CatalogColorFacet,
  CatalogFacets,
} from "@/features/products/domain/catalog-filters";
import type { CatalogPricePresence } from "@/features/products/domain/catalog-sort";
import {
  CACHE_TAGS,
  PUBLIC_CACHE_REVALIDATE_SECONDS,
} from "@/lib/cache/tags";
import type { Locale } from "@/lib/i18n/config";

type CategoryRow = {
  id: string;
  parentId: string | null;
  title: string;
  slug: string;
};

const activeProductWhere = and(
  eq(products.status, "ACTIVE"),
  isNull(products.deletedAt),
);

function translationFor(
  translations: { hy?: LocaleTranslation; en?: LocaleTranslation; ru?: LocaleTranslation },
  locale: Locale,
): LocaleTranslation | null {
  return translations[locale] ?? translations.hy ?? translations.en ?? null;
}

function groupProductIdsByCategory(
  rows: readonly { categoryId: string; productId: string }[],
): Map<string, Set<string>> {
  const productIdsByCategoryId = new Map<string, Set<string>>();
  for (const row of rows) {
    const productIds = productIdsByCategoryId.get(row.categoryId) ?? new Set();
    productIds.add(row.productId);
    productIdsByCategoryId.set(row.categoryId, productIds);
  }
  return productIdsByCategoryId;
}

async function loadCategoryFacets(
  locale: Locale,
  pricePresence: CatalogPricePresence,
): Promise<CatalogCategoryFacet[]> {
  const rows = await getDb()
    .select({
      id: categories.id,
      parentId: categories.parentId,
      translations: categories.translations,
    })
    .from(categories)
    .where(and(eq(categories.status, "ACTIVE"), isNull(categories.deletedAt)))
    .orderBy(asc(categories.sortOrder), asc(categories.createdAt));

  const mapped: CategoryRow[] = [];
  for (const row of rows) {
    const translation = translationFor(row.translations, locale);
    if (!translation) continue;
    mapped.push({
      id: row.id,
      parentId: row.parentId,
      title: translation.title,
      slug: translation.slug,
    });
  }

  const linkRows =
    mapped.length === 0
      ? []
      : await getDb()
          .select({
            categoryId: productCategories.categoryId,
            productId: productCategories.productId,
            priceAmount: products.priceAmount,
          })
          .from(productCategories)
          .innerJoin(products, eq(products.id, productCategories.productId))
          .where(
            and(
              activeProductWhere,
              inArray(
                productCategories.categoryId,
                mapped.map((row) => row.id),
              ),
            ),
          );

  const withPriceRows = linkRows.filter((row) => row.priceAmount > 0);
  const withoutPriceRows = linkRows.filter((row) => row.priceAmount === 0);
  const tree = buildCategoryTree(mapped);
  const withFacets = buildCategoryFacetsWithDistinctCounts(
    tree,
    groupProductIdsByCategory(withPriceRows),
  );
  const withoutFacets = buildCategoryFacetsWithDistinctCounts(
    tree,
    groupProductIdsByCategory(withoutPriceRows),
  );

  if (pricePresence === "without") {
    return mergeCategoryFacetsByPricePresence(
      withoutFacets,
      withFacets,
      "with",
    );
  }

  return mergeCategoryFacetsByPricePresence(
    withFacets,
    withoutFacets,
    "without",
  );
}

function groupProductIdsByBrand(
  rows: readonly { brandId: string; productId: string }[],
): Map<string, Set<string>> {
  const productIdsByBrandId = new Map<string, Set<string>>();
  for (const row of rows) {
    const productIds = productIdsByBrandId.get(row.brandId) ?? new Set();
    productIds.add(row.productId);
    productIdsByBrandId.set(row.brandId, productIds);
  }
  return productIdsByBrandId;
}

async function loadBrandFacets(
  locale: Locale,
  pricePresence: CatalogPricePresence,
): Promise<CatalogBrandFacet[]> {
  const rows = await getDb()
    .select({
      id: brands.id,
      translations: brands.translations,
    })
    .from(brands)
    .where(isNull(brands.deletedAt))
    .orderBy(asc(brands.sortOrder), asc(brands.createdAt));

  const mapped: { id: string; slug: string; title: string }[] = [];
  for (const row of rows) {
    const translation = translationFor(row.translations, locale);
    if (!translation) continue;
    mapped.push({
      id: row.id,
      slug: translation.slug,
      title: translation.title,
    });
  }

  const linkRows =
    mapped.length === 0
      ? []
      : await getDb()
          .select({
            brandId: productBrands.brandId,
            productId: productBrands.productId,
            priceAmount: products.priceAmount,
          })
          .from(productBrands)
          .innerJoin(products, eq(products.id, productBrands.productId))
          .where(
            and(
              activeProductWhere,
              inArray(
                productBrands.brandId,
                mapped.map((row) => row.id),
              ),
            ),
          );

  const withPriceRows = linkRows.filter((row) => row.priceAmount > 0);
  const withoutPriceRows = linkRows.filter((row) => row.priceAmount === 0);
  const withFacets = buildBrandFacetsWithCounts(
    mapped,
    groupProductIdsByBrand(withPriceRows),
  );
  const withoutFacets = buildBrandFacetsWithCounts(
    mapped,
    groupProductIdsByBrand(withoutPriceRows),
  );

  if (pricePresence === "without") {
    return mergeBrandFacetsByPricePresence(withoutFacets, withFacets, "with");
  }

  return mergeBrandFacetsByPricePresence(withFacets, withoutFacets, "without");
}

async function loadAttributeFacets(
  locale: Locale,
): Promise<{ attributes: CatalogAttributeFacet[]; colors: CatalogColorFacet[] }> {
  const attributeRows = await getDb()
    .select({
      id: attributes.id,
      key: attributes.key,
      translations: attributes.translations,
    })
    .from(attributes)
    .where(isNull(attributes.deletedAt))
    .orderBy(asc(attributes.sortOrder), asc(attributes.createdAt));

  if (attributeRows.length === 0) {
    return { attributes: [], colors: [] };
  }

  const valueRows = await getDb()
    .select({
      id: attributeValues.id,
      attributeId: attributeValues.attributeId,
      translations: attributeValues.translations,
      colorHex: attributeValues.colorHex,
    })
    .from(attributeValues)
    .where(
      inArray(
        attributeValues.attributeId,
        attributeRows.map((row) => row.id),
      ),
    )
    .orderBy(asc(attributeValues.sortOrder), asc(attributeValues.createdAt));

  const valuesByAttribute = new Map<
    string,
    CatalogAttributeFacet["values"]
  >();
  for (const row of valueRows) {
    const translation = translationFor(row.translations, locale);
    if (!translation) continue;
    const list = valuesByAttribute.get(row.attributeId) ?? [];
    list.push({
      id: row.id,
      title: translation.title,
      colorHex: row.colorHex
        ? row.colorHex.replace(/^#/, "").toLowerCase()
        : null,
    });
    valuesByAttribute.set(row.attributeId, list);
  }

  const facets: CatalogAttributeFacet[] = [];

  for (const row of attributeRows) {
    const translation = translationFor(row.translations, locale);
    if (!translation) continue;
    const values = valuesByAttribute.get(row.id) ?? [];
    if (values.length === 0) continue;
    facets.push({
      id: row.id,
      key: row.key,
      title: translation.title,
      values,
    });
  }

  return { attributes: facets, colors: colorFacetsFromAttributes(facets) };
}

async function loadPriceBounds(): Promise<{
  minPriceAmd: number | null;
  maxPriceAmd: number | null;
}> {
  const [row] = await getDb()
    .select({
      minPriceAmd: sql<number | null>`min(${products.priceAmount})::int`,
      maxPriceAmd: sql<number | null>`max(${products.priceAmount})::int`,
    })
    .from(products)
    .where(activeProductWhere);

  return {
    minPriceAmd: row?.minPriceAmd ?? null,
    maxPriceAmd: row?.maxPriceAmd ?? null,
  };
}

async function loadCatalogFacets(
  locale: Locale,
  pricePresence: CatalogPricePresence,
): Promise<CatalogFacets> {
  const [categoryTree, brandList, attributeFacets, price] = await Promise.all([
    loadCategoryFacets(locale, pricePresence),
    loadBrandFacets(locale, pricePresence),
    loadAttributeFacets(locale),
    loadPriceBounds(),
  ]);

  return {
    categories: categoryTree,
    brands: brandList,
    attributes: attributeFacets.attributes,
    colors: attributeFacets.colors,
    minPriceAmd: price.minPriceAmd,
    maxPriceAmd: price.maxPriceAmd,
  };
}

/**
 * Storefront filter facets: categories, brands, attributes, colors, and AMD price bounds.
 * Category/brand counts prefer the active priced/unpriced mode; entries that
 * only exist in the other mode stay visible and switch mode on select.
 */
export async function getCatalogFacets(
  locale: Locale,
  pricePresence: CatalogPricePresence,
): Promise<CatalogFacets> {
  return unstable_cache(
    async () => loadCatalogFacets(locale, pricePresence),
    ["catalog-facets", locale, pricePresence],
    {
      tags: [CACHE_TAGS.products, CACHE_TAGS.brands],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();
}

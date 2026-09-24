import "server-only";

import {
  listCatalogBrandPresence,
  type CatalogBrandPresence,
} from "@/features/products/application/load-catalog-brand-presence";
import { getCatalogFacets } from "@/features/products/application/load-catalog-facets";
import { getCatalogPriceBoundsForFilter } from "@/features/products/application/load-catalog-price-bounds";
import {
  resolvePricePresenceForSelectedBrands,
  restrictBrandFacetsToProductScope,
} from "@/features/products/domain/catalog-brand-facet-counts";
import {
  collectBrandIdsForSlugs,
  collectCategoryIdsForSlugs,
  groupSelectedAttributeValueIds,
  mergeCatalogAttributeValueIds,
  type CatalogBrandFacet,
  type CatalogFacets,
} from "@/features/products/domain/catalog-filters";
import type { CatalogSearchParams } from "@/features/products/domain/catalog-search-params";
import type { CatalogPricePresence } from "@/features/products/domain/catalog-sort";
import type { CatalogListFilter } from "@/features/products/queries";
import type { Locale } from "@/lib/i18n/config";

function alternatePricePresence(
  current: CatalogPricePresence,
): CatalogPricePresence {
  return current === "with" ? "without" : "with";
}

function hasProductSetScope(filter: CatalogListFilter): boolean {
  return Boolean(
    filter.q ||
      (filter.categoryIds && filter.categoryIds.length > 0) ||
      (filter.attributeValueIdGroups &&
        filter.attributeValueIdGroups.length > 0),
  );
}

function hasPriceBoundScope(filter: CatalogListFilter): boolean {
  return (
    hasProductSetScope(filter) ||
    Boolean(filter.brandIds && filter.brandIds.length > 0)
  );
}

function selectionFilter(
  filters: CatalogSearchParams,
  facets: CatalogFacets,
): CatalogListFilter {
  return {
    q: filters.q ?? undefined,
    categoryIds: collectCategoryIdsForSlugs(
      facets.categories,
      filters.categorySlugs,
    ),
    brandIds: collectBrandIdsForSlugs(facets.brands, filters.brandSlugs),
    attributeValueIdGroups: groupSelectedAttributeValueIds(
      facets.attributes,
      mergeCatalogAttributeValueIds(
        filters.attributeValueIds,
        facets.attributes,
        filters.colorHexes,
      ),
    ),
  };
}

function restrictBrandsForPresence(
  brands: readonly CatalogBrandFacet[],
  presence: CatalogBrandPresence,
  pricePresence: CatalogPricePresence,
  selectedSlugs: readonly string[],
): CatalogBrandFacet[] {
  const activeIds =
    pricePresence === "with"
      ? presence.pricedBrandIds
      : presence.unpricedBrandIds;
  const alternateIds =
    pricePresence === "with"
      ? presence.unpricedBrandIds
      : presence.pricedBrandIds;
  return restrictBrandFacetsToProductScope(
    brands,
    new Set(activeIds),
    new Set(alternateIds),
    alternatePricePresence(pricePresence),
    selectedSlugs,
  );
}

async function applyScopedBrands(
  locale: Locale,
  parsed: CatalogSearchParams,
  facets: CatalogFacets,
  pricePresence: CatalogPricePresence,
  productScope: CatalogListFilter,
): Promise<{
  facets: CatalogFacets;
  brands: CatalogBrandFacet[];
  pricePresence: CatalogPricePresence;
}> {
  const presence = hasProductSetScope(productScope)
    ? await listCatalogBrandPresence(productScope)
    : null;
  const brandsFor = (nextFacets: CatalogFacets, mode: CatalogPricePresence) =>
    presence
      ? restrictBrandsForPresence(
          nextFacets.brands,
          presence,
          mode,
          parsed.brandSlugs,
        )
      : nextFacets.brands;

  const brands = brandsFor(facets, pricePresence);
  const resolved = resolvePricePresenceForSelectedBrands(
    brands,
    parsed.brandSlugs,
    pricePresence,
  );
  if (resolved === pricePresence) {
    return { facets, brands, pricePresence };
  }

  const nextFacets = await getCatalogFacets(locale, resolved);
  return {
    facets: nextFacets,
    brands: brandsFor(nextFacets, resolved),
    pricePresence: resolved,
  };
}

/**
 * Storefront facets limited to products in the current category/search set.
 * Brand options and price bounds follow the matching products; the category
 * tree stays global so shoppers can still move between categories.
 */
export async function loadScopedCatalogFacets(
  locale: Locale,
  parsed: CatalogSearchParams,
): Promise<{ facets: CatalogFacets; pricePresence: CatalogPricePresence }> {
  const initial = await getCatalogFacets(locale, parsed.pricePresence);
  const selection = selectionFilter(parsed, initial);
  const productScope: CatalogListFilter = {
    q: selection.q,
    categoryIds: selection.categoryIds,
    attributeValueIdGroups: selection.attributeValueIdGroups,
  };
  const scoped = await applyScopedBrands(
    locale,
    parsed,
    initial,
    parsed.pricePresence,
    productScope,
  );
  const priceScope: CatalogListFilter = {
    ...productScope,
    brandIds: selection.brandIds,
    pricePresence: scoped.pricePresence,
  };
  const priceBounds =
    scoped.pricePresence === "without"
      ? { minPriceAmd: null, maxPriceAmd: null }
      : hasPriceBoundScope(priceScope)
        ? await getCatalogPriceBoundsForFilter(priceScope)
        : {
            minPriceAmd: scoped.facets.minPriceAmd,
            maxPriceAmd: scoped.facets.maxPriceAmd,
          };

  return {
    facets: {
      ...scoped.facets,
      brands: scoped.brands,
      minPriceAmd: priceBounds.minPriceAmd,
      maxPriceAmd: priceBounds.maxPriceAmd,
    },
    pricePresence: scoped.pricePresence,
  };
}

import "server-only";

import { listCatalogProductAttributeUsages } from "@/features/products/application/load-catalog-attribute-usages";
import { getCatalogFacets } from "@/features/products/application/load-catalog-facets";
import {
  catalogAttributeIdByValueId,
  collectUsedAttributeValueIds,
  toDisplayAttributeFacets,
} from "@/features/products/domain/catalog-attribute-facets";
import { resolvePricePresenceForSelectedBrands } from "@/features/products/domain/catalog-brand-facet-counts";
import {
  attributeValueIdsForColorHexes,
  collectBrandIdsForSlugs,
  collectCategoryIdsForSlugs,
  groupSelectedAttributeValueIds,
  type CatalogFacets,
} from "@/features/products/domain/catalog-filters";
import {
  amdRangeToDisplayMajor,
  displayMajorRangeToAmd,
  normalizeSelectedPriceRange,
  type DisplayMajorRange,
} from "@/features/products/domain/catalog-price-bounds";
import {
  parseCatalogSearchParams,
  type CatalogSearchParams,
} from "@/features/products/domain/catalog-search-params";
import type { CatalogPricePresence } from "@/features/products/domain/catalog-sort";
import {
  getActiveProductsPage,
  type CatalogListFilter,
  type CatalogProduct,
} from "@/features/products/queries";
import { getCheckoutRateSnapshot } from "@/lib/fx/service";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

export type StorefrontCatalogResult = {
  filters: CatalogSearchParams;
  facets: CatalogFacets;
  priceBounds: DisplayMajorRange | null;
  products: CatalogProduct[];
  total: number;
  pageSize: number;
  page: number;
  totalPages: number;
};

function toDisplayBounds(
  facets: CatalogFacets,
  currency: Currency,
  rate: string,
): DisplayMajorRange | null {
  if (facets.minPriceAmd == null || facets.maxPriceAmd == null) return null;
  return amdRangeToDisplayMajor(
    facets.minPriceAmd,
    facets.maxPriceAmd,
    currency,
    rate,
  );
}

function mergeAttributeValueIds(
  filters: CatalogSearchParams,
  facets: CatalogFacets,
): string[] {
  const fromAttr = filters.attributeValueIds;
  const fromColors = attributeValueIdsForColorHexes(
    facets.attributes,
    filters.colorHexes,
  );
  if (fromColors.length === 0) return fromAttr;
  const seen = new Set(fromAttr);
  const merged = [...fromAttr];
  for (const id of fromColors) {
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push(id);
  }
  return merged;
}

function toProductFilter(
  filters: CatalogSearchParams,
  facets: CatalogFacets,
  priceBounds: DisplayMajorRange | null,
  currency: Currency,
  rate: string,
): CatalogListFilter {
  const categoryIds = collectCategoryIdsForSlugs(
    facets.categories,
    filters.categorySlugs,
  );
  const brandIds = collectBrandIdsForSlugs(facets.brands, filters.brandSlugs);
  const attributeValueIds = mergeAttributeValueIds(filters, facets);
  const attributeValueIdGroups = groupSelectedAttributeValueIds(
    facets.attributes,
    attributeValueIds,
  );
  const hasPrice =
    priceBounds != null &&
    (filters.minPrice != null || filters.maxPrice != null);
  const amdRange =
    hasPrice && priceBounds
      ? displayMajorRangeToAmd(
          filters.minPrice ?? priceBounds.minMajor,
          filters.maxPrice ?? priceBounds.maxMajor,
          currency,
          rate,
        )
      : null;

  if (
    categoryIds.length === 0 &&
    brandIds.length === 0 &&
    attributeValueIdGroups.length === 0 &&
    amdRange == null &&
    !filters.q
  ) {
    return {
      sort: filters.sort,
      pricePresence: filters.pricePresence,
    };
  }
  return {
    q: filters.q ?? undefined,
    categoryIds,
    brandIds,
    attributeValueIdGroups,
    minPriceAmd: amdRange?.minAmd,
    maxPriceAmd: amdRange?.maxAmd,
    sort: filters.sort,
    pricePresence: filters.pricePresence,
  };
}

async function loadFacetsForPricePresence(
  locale: Locale,
  pricePresence: CatalogPricePresence,
  brandSlugs: readonly string[],
): Promise<{ facets: CatalogFacets; pricePresence: CatalogPricePresence }> {
  let facets = await getCatalogFacets(locale, pricePresence);
  const resolved = resolvePricePresenceForSelectedBrands(
    facets.brands,
    brandSlugs,
    pricePresence,
  );
  if (resolved === pricePresence) {
    return { facets, pricePresence };
  }
  facets = await getCatalogFacets(locale, resolved);
  return { facets, pricePresence: resolved };
}

/** Loads the filtered storefront catalog, facets, and normalized URL state. */
export async function loadStorefrontCatalog(
  locale: Locale,
  searchParams: Record<string, string | string[] | undefined>,
  currency: Currency,
): Promise<StorefrontCatalogResult> {
  const parsed = parseCatalogSearchParams(searchParams);
  const [{ facets, pricePresence }, quote] = await Promise.all([
    loadFacetsForPricePresence(locale, parsed.pricePresence, parsed.brandSlugs),
    getCheckoutRateSnapshot(currency),
  ]);
  const priceBounds = toDisplayBounds(facets, currency, quote.rate);
  const price = priceBounds
    ? normalizeSelectedPriceRange(parsed.minPrice, parsed.maxPrice, priceBounds)
    : { minPrice: null, maxPrice: null };
  const attributeValueIds = mergeAttributeValueIds(parsed, facets);
  const filters: CatalogSearchParams = {
    ...parsed,
    ...price,
    attributeValueIds,
    // Prefer attr ids; drop legacy color once resolved into attr.
    colorHexes: [],
    pricePresence,
  };
  const listFilter = toProductFilter(
    filters,
    facets,
    priceBounds,
    currency,
    quote.rate,
  );
  const usages = await listCatalogProductAttributeUsages(listFilter);
  const displayFacets = toDisplayAttributeFacets(
    facets.attributes,
    collectUsedAttributeValueIds(
      usages,
      catalogAttributeIdByValueId(facets.attributes),
      listFilter.attributeValueIdGroups ?? [],
    ),
    filters.attributeValueIds,
  );

  let page = filters.page;
  let catalog = await getActiveProductsPage(locale, page, listFilter);
  const totalPages = Math.max(1, Math.ceil(catalog.total / catalog.pageSize));
  if (page > totalPages) {
    page = totalPages;
    catalog = await getActiveProductsPage(locale, page, listFilter);
  }

  return {
    filters: { ...filters, page },
    facets: {
      ...facets,
      attributes: displayFacets.attributes,
      colors: displayFacets.colors,
    },
    priceBounds,
    products: catalog.products,
    total: catalog.total,
    pageSize: catalog.pageSize,
    page,
    totalPages,
  };
}

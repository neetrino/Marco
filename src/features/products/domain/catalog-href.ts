import type { CatalogSearchParams } from "@/features/products/domain/catalog-search-params";
import {
  DEFAULT_CATALOG_PRICE_PRESENCE,
  DEFAULT_CATALOG_SORT,
  type CatalogPricePresence,
  type CatalogSort,
} from "@/features/products/domain/catalog-sort";

function appendList(
  params: URLSearchParams,
  key: string,
  values: readonly string[],
): void {
  for (const value of values) {
    params.append(key, value);
  }
}

/** Builds a locale catalog path from normalized search params. */
export function catalogHref(
  locale: string,
  filters: CatalogSearchParams,
): string {
  const params = new URLSearchParams();
  if (filters.q) {
    params.set("q", filters.q);
  }
  appendList(params, "category", filters.categorySlugs);
  appendList(params, "brand", filters.brandSlugs);
  appendList(params, "attr", filters.attributeValueIds ?? []);
  appendList(params, "color", filters.colorHexes ?? []);
  if (filters.minPrice != null) {
    params.set("minPrice", String(filters.minPrice));
  }
  if (filters.maxPrice != null) {
    params.set("maxPrice", String(filters.maxPrice));
  }
  if (filters.sort !== DEFAULT_CATALOG_SORT) {
    params.set("sort", filters.sort);
  }
  if (filters.pricePresence !== DEFAULT_CATALOG_PRICE_PRESENCE) {
    params.set("pricePresence", filters.pricePresence);
  }
  if (filters.page > 1) {
    params.set("page", String(filters.page));
  }

  const query = params.toString();
  return query ? `/${locale}/products?${query}` : `/${locale}/products`;
}

function toggleValue(values: readonly string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

/** Toggles a category slug and resets pagination. */
export function withToggledCategory(
  filters: CatalogSearchParams,
  slug: string,
  options?: { forcePricePresence?: CatalogPricePresence },
): CatalogSearchParams {
  const categorySlugs = toggleValue(filters.categorySlugs, slug);
  const selecting = categorySlugs.includes(slug);
  return {
    ...filters,
    page: 1,
    categorySlugs,
    pricePresence:
      selecting && options?.forcePricePresence
        ? options.forcePricePresence
        : filters.pricePresence,
  };
}

/** Toggles a brand slug and resets pagination. */
export function withToggledBrand(
  filters: CatalogSearchParams,
  slug: string,
  options?: { forcePricePresence?: CatalogPricePresence },
): CatalogSearchParams {
  const brandSlugs = toggleValue(filters.brandSlugs, slug);
  const selecting = brandSlugs.includes(slug);
  return {
    ...filters,
    page: 1,
    brandSlugs,
    pricePresence:
      selecting && options?.forcePricePresence
        ? options.forcePricePresence
        : filters.pricePresence,
  };
}

/** Toggles a 6-digit color hex and resets pagination. */
export function withToggledColor(
  filters: CatalogSearchParams,
  hex: string,
): CatalogSearchParams {
  return {
    ...filters,
    page: 1,
    colorHexes: toggleValue(filters.colorHexes, hex),
  };
}

/** Toggles an attribute value id and resets pagination. */
export function withToggledAttributeValue(
  filters: CatalogSearchParams,
  valueId: string,
): CatalogSearchParams {
  const current = filters.attributeValueIds ?? [];
  return {
    ...filters,
    page: 1,
    attributeValueIds: toggleValue(current, valueId),
  };
}

/** Sets display-currency major price bounds and resets pagination. */
export function withPriceRange(
  filters: CatalogSearchParams,
  minPrice: number | null,
  maxPrice: number | null,
): CatalogSearchParams {
  return {
    ...filters,
    page: 1,
    minPrice,
    maxPrice,
  };
}

/** Sets the catalog page while keeping other filters. */
export function withCatalogPage(
  filters: CatalogSearchParams,
  page: number,
): CatalogSearchParams {
  return { ...filters, page };
}

/** Sets listing sort and resets pagination. */
export function withCatalogSort(
  filters: CatalogSearchParams,
  sort: CatalogSort,
): CatalogSearchParams {
  return { ...filters, page: 1, sort };
}

/** Sets priced vs unpriced listing mode and resets pagination. */
export function withCatalogPricePresence(
  filters: CatalogSearchParams,
  pricePresence: CatalogPricePresence,
): CatalogSearchParams {
  if (pricePresence === "without") {
    return {
      ...filters,
      page: 1,
      pricePresence,
      minPrice: null,
      maxPrice: null,
    };
  }
  return { ...filters, page: 1, pricePresence };
}

import { describe, expect, it } from "vitest";

import type { CatalogFacets } from "@/features/products/domain/catalog-filters";
import {
  CATALOG_GRID_COLUMNS,
  CATALOG_MAX_PAGE_SIZE,
  CATALOG_MIN_PAGE_SIZE,
  catalogPageSizeForFacets,
  normalizeCatalogPageSize,
} from "@/features/products/domain/catalog-page-size";

const emptyFacets: CatalogFacets = {
  categories: [],
  brands: [],
  attributes: [],
  colors: [],
  minPriceAmd: null,
  maxPriceAmd: null,
};

function brandList(count: number): CatalogFacets["brands"] {
  return Array.from({ length: count }, (_, index) => ({
    id: `b${index}`,
    slug: `brand-${index}`,
    title: `Brand ${index}`,
    count: 1,
  }));
}

describe("normalizeCatalogPageSize", () => {
  it("falls back to the current catalog page when the value is invalid", () => {
    expect(normalizeCatalogPageSize(0)).toBe(CATALOG_MIN_PAGE_SIZE);
    expect(normalizeCatalogPageSize(Number.NaN)).toBe(CATALOG_MIN_PAGE_SIZE);
  });

  it("caps oversized requests", () => {
    expect(normalizeCatalogPageSize(500)).toBe(CATALOG_MAX_PAGE_SIZE);
  });
});

describe("catalogPageSizeForFacets", () => {
  it("keeps the current 24-item page when filters are short", () => {
    expect(
      catalogPageSizeForFacets({
        ...emptyFacets,
        brands: brandList(8),
        minPriceAmd: 0,
        maxPriceAmd: 1_000,
      }),
    ).toBe(CATALOG_MIN_PAGE_SIZE);
  });

  it("grows the page in full grid rows so products cover a long brand list", () => {
    const pageSize = catalogPageSizeForFacets({
      ...emptyFacets,
      brands: brandList(120),
    });
    expect(pageSize).toBeGreaterThan(CATALOG_MIN_PAGE_SIZE);
    expect(pageSize % CATALOG_GRID_COLUMNS).toBe(0);
    expect(pageSize).toBeLessThan(CATALOG_MAX_PAGE_SIZE);
  });

  it("caps an extremely long facet column", () => {
    const pageSize = catalogPageSizeForFacets({
      ...emptyFacets,
      brands: brandList(800),
    });
    expect(pageSize).toBe(CATALOG_MAX_PAGE_SIZE);
  });
});

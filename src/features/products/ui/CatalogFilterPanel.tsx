"use client";

import { catalogNonColorAttributeFacets } from "@/features/products/domain/catalog-attribute-facets";
import { findBrandFacetBySlug } from "@/features/products/domain/catalog-brand-facet-counts";
import { findCategoryFacetBySlug } from "@/features/products/domain/catalog-category-facet-counts";
import type { CatalogFacets } from "@/features/products/domain/catalog-filters";
import {
  withPriceRange,
  withToggledAttributeValue,
  withToggledBrand,
  withToggledCategory,
} from "@/features/products/domain/catalog-href";
import { normalizeSelectedPriceRange } from "@/features/products/domain/catalog-price-bounds";
import type { CatalogSearchParams } from "@/features/products/domain/catalog-search-params";
import { CatalogAttributeFilter } from "@/features/products/ui/CatalogAttributeFilter";
import { CatalogBrandFilter } from "@/features/products/ui/CatalogBrandFilter";
import { CatalogCategoryFilter } from "@/features/products/ui/CatalogCategoryFilter";
import { CatalogColorFilter } from "@/features/products/ui/CatalogColorFilter";
import { CatalogPriceFilter } from "@/features/products/ui/CatalogPriceFilter";
import {
  CATALOG_FILTER_SECTION,
  CATALOG_FILTER_TITLE,
} from "@/features/products/ui/catalog-filter-classes";
import type { Currency } from "@/lib/money/currency";

export type CatalogFilterCopy = {
  categories: string;
  price: string;
  brands: string;
  colors: string;
  expandCategory: string;
  collapseCategory: string;
  minPrice: string;
  maxPrice: string;
};

type CatalogFilterPanelProps = {
  filters: CatalogSearchParams;
  facets: CatalogFacets;
  priceBounds: { minMajor: number; maxMajor: number } | null;
  currency: Currency;
  copy: CatalogFilterCopy;
  onFiltersChange: (next: CatalogSearchParams) => void;
};

export function CatalogFilterPanel({
  filters,
  facets,
  priceBounds,
  currency,
  copy,
  onFiltersChange,
}: CatalogFilterPanelProps) {
  const selectedCategories = new Set(filters.categorySlugs);
  const selectedBrands = new Set(filters.brandSlugs);
  const selectedAttributeValues = new Set(filters.attributeValueIds);
  const selectedMin = filters.minPrice ?? priceBounds?.minMajor ?? 0;
  const selectedMax = filters.maxPrice ?? priceBounds?.maxMajor ?? 0;
  const textAttributes = catalogNonColorAttributeFacets(facets.attributes);

  return (
    <div className="flex flex-col">
      <section className={CATALOG_FILTER_SECTION}>
        <h2 className={CATALOG_FILTER_TITLE}>{copy.categories}</h2>
        <CatalogCategoryFilter
          nodes={facets.categories}
          selectedSlugs={selectedCategories}
          expandLabel={copy.expandCategory}
          collapseLabel={copy.collapseCategory}
          onToggle={(slug) => {
            const facet = findCategoryFacetBySlug(facets.categories, slug);
            onFiltersChange(
              withToggledCategory(filters, slug, {
                forcePricePresence: facet?.forcePricePresence,
              }),
            );
          }}
        />
      </section>
      <section className={CATALOG_FILTER_SECTION}>
        <h2 className={CATALOG_FILTER_TITLE}>{copy.brands}</h2>
        <CatalogBrandFilter
          brands={facets.brands}
          selectedSlugs={selectedBrands}
          onToggle={(slug) => {
            const facet = findBrandFacetBySlug(facets.brands, slug);
            onFiltersChange(
              withToggledBrand(filters, slug, {
                forcePricePresence: facet?.forcePricePresence,
              }),
            );
          }}
        />
      </section>
      {priceBounds ? (
        <section className={CATALOG_FILTER_SECTION}>
          <CatalogPriceFilter
            key={`${priceBounds.minMajor}-${priceBounds.maxMajor}-${selectedMin}-${selectedMax}`}
            title={copy.price}
            minBound={priceBounds.minMajor}
            maxBound={priceBounds.maxMajor}
            selectedMin={selectedMin}
            selectedMax={selectedMax}
            currency={currency}
            minLabel={copy.minPrice}
            maxLabel={copy.maxPrice}
            onChange={(min, max) => {
              const next = normalizeSelectedPriceRange(min, max, priceBounds);
              onFiltersChange(
                withPriceRange(filters, next.minPrice, next.maxPrice),
              );
            }}
          />
        </section>
      ) : null}
      {facets.colors.length > 0 ? (
        <section className={CATALOG_FILTER_SECTION}>
          <h2 className={CATALOG_FILTER_TITLE}>{copy.colors}</h2>
          <CatalogColorFilter
            colors={facets.colors}
            selectedIds={selectedAttributeValues}
            label={copy.colors}
            onToggle={(valueId) =>
              onFiltersChange(withToggledAttributeValue(filters, valueId))
            }
          />
        </section>
      ) : null}
      {textAttributes.map((attribute) => (
        <section key={attribute.id} className={CATALOG_FILTER_SECTION}>
          <h2 className={CATALOG_FILTER_TITLE}>{attribute.title}</h2>
          <CatalogAttributeFilter
            attribute={attribute}
            selectedIds={selectedAttributeValues}
            onToggle={(valueId) =>
              onFiltersChange(withToggledAttributeValue(filters, valueId))
            }
          />
        </section>
      ))}
    </div>
  );
}

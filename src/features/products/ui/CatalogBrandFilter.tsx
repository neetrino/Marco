"use client";

import type { CatalogBrandFacet } from "@/features/products/domain/catalog-filters";
import { CatalogFilterCheckRow } from "@/features/products/ui/CatalogFilterCheckRow";
import {
  CATALOG_FILTER_LIST,
  catalogFilterBrandLabelClass,
} from "@/features/products/ui/catalog-filter-classes";

type CatalogBrandFilterProps = {
  brands: readonly CatalogBrandFacet[];
  selectedSlugs: ReadonlySet<string>;
  onToggle: (slug: string) => void;
};

export function CatalogBrandFilter({
  brands,
  selectedSlugs,
  onToggle,
}: CatalogBrandFilterProps) {
  if (brands.length === 0) return null;

  return (
    <ul className={CATALOG_FILTER_LIST}>
      {brands.map((brand) => {
        const selected = selectedSlugs.has(brand.slug);
        return (
          <li key={brand.id}>
            <CatalogFilterCheckRow
              label={brand.title}
              selected={selected}
              variant="filled"
              imageUrl={brand.imageUrl}
              labelClassName={catalogFilterBrandLabelClass(selected)}
              onToggle={() => onToggle(brand.slug)}
            />
          </li>
        );
      })}
    </ul>
  );
}

"use client";

import type { CatalogAttributeFacet } from "@/features/products/domain/catalog-filters";
import { CatalogFilterCheckRow } from "@/features/products/ui/CatalogFilterCheckRow";
import {
  CATALOG_FILTER_LIST,
  catalogFilterBrandLabelClass,
} from "@/features/products/ui/catalog-filter-classes";

type CatalogAttributeFilterProps = {
  attribute: CatalogAttributeFacet;
  selectedIds: ReadonlySet<string>;
  onToggle: (valueId: string) => void;
};

export function CatalogAttributeFilter({
  attribute,
  selectedIds,
  onToggle,
}: CatalogAttributeFilterProps) {
  if (attribute.values.length === 0) return null;

  return (
    <ul className={CATALOG_FILTER_LIST}>
      {attribute.values.map((value) => {
        const selected = selectedIds.has(value.id);
        return (
          <li key={value.id}>
            <CatalogFilterCheckRow
              selected={selected}
              variant="filled"
              label={value.title}
              labelClassName={catalogFilterBrandLabelClass(selected)}
              onToggle={() => onToggle(value.id)}
            />
          </li>
        );
      })}
    </ul>
  );
}

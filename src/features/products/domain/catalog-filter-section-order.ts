export const CATALOG_FILTER_SECTION_IDS = [
  "brands",
  "price",
  "colors",
  "attributes",
  "categories",
] as const;

export type CatalogFilterSectionId = (typeof CATALOG_FILTER_SECTION_IDS)[number];

/**
 * Desktop sidebar and the mobile filter drawer share this order.
 * Display order only; selected filters and toggle behavior are unchanged.
 */
export function catalogFilterSectionOrder(): readonly CatalogFilterSectionId[] {
  return CATALOG_FILTER_SECTION_IDS;
}

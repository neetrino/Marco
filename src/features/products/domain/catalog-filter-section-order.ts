export const CATALOG_FILTER_SECTION_IDS = [
  "categories",
  "brands",
  "price",
  "colors",
  "attributes",
] as const;

export type CatalogFilterSectionId = (typeof CATALOG_FILTER_SECTION_IDS)[number];

export type CatalogFilterPanelVariant = "sidebar" | "drawer";

/**
 * Sidebar keeps category / brand / price first.
 * Mobile drawer puts other facets first so category, price, and brand sit below.
 */
export function catalogFilterSectionOrder(
  variant: CatalogFilterPanelVariant,
): readonly CatalogFilterSectionId[] {
  if (variant === "drawer") {
    return ["colors", "attributes", "categories", "price", "brands"];
  }
  return CATALOG_FILTER_SECTION_IDS;
}

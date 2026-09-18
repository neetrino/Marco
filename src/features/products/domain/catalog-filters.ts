import type { CatalogPricePresence } from "@/features/products/domain/catalog-sort";

export type CatalogCategoryFacet = {
  id: string;
  slug: string;
  title: string;
  count: number;
  children: CatalogCategoryFacet[];
  /**
   * When the category has no products in the active price mode but has some
   * in the other mode, selecting it should switch listing to that mode.
   */
  forcePricePresence?: CatalogPricePresence;
};

export type CatalogBrandFacet = {
  id: string;
  slug: string;
  title: string;
  count: number;
  /** Primary brand mark shown beside the filter label. */
  imageUrl?: string | null;
  /**
   * When the brand has no products in the active price mode but has some
   * in the other mode, selecting it should switch listing to that mode.
   */
  forcePricePresence?: CatalogPricePresence;
};

export type CatalogColorFacet = {
  id: string;
  hex: string;
};

export type CatalogAttributeValueFacet = {
  id: string;
  title: string;
  colorHex: string | null;
};

export type CatalogAttributeFacet = {
  id: string;
  key: string;
  title: string;
  values: CatalogAttributeValueFacet[];
};

export type CatalogFacets = {
  categories: CatalogCategoryFacet[];
  brands: CatalogBrandFacet[];
  attributes: CatalogAttributeFacet[];
  /** Derived color swatches from attribute values that have a hex. */
  colors: CatalogColorFacet[];
  minPriceAmd: number | null;
  maxPriceAmd: number | null;
};

function collectSubtreeIds(node: CatalogCategoryFacet): string[] {
  const ids = [node.id];
  for (const child of node.children) {
    ids.push(...collectSubtreeIds(child));
  }
  return ids;
}

/** Category ids (including descendants) matching selected locale slugs. */
export function collectCategoryIdsForSlugs(
  nodes: readonly CatalogCategoryFacet[],
  slugs: readonly string[],
): string[] {
  if (slugs.length === 0) return [];
  const wanted = new Set(slugs);
  const ids = new Set<string>();

  function walk(node: CatalogCategoryFacet): void {
    if (wanted.has(node.slug)) {
      for (const id of collectSubtreeIds(node)) {
        ids.add(id);
      }
    }
    for (const child of node.children) {
      walk(child);
    }
  }

  for (const node of nodes) {
    walk(node);
  }
  return [...ids];
}

/** Brand ids matching selected locale slugs. */
export function collectBrandIdsForSlugs(
  brands: readonly CatalogBrandFacet[],
  slugs: readonly string[],
): string[] {
  if (slugs.length === 0) return [];
  const wanted = new Set(slugs);
  return brands.filter((brand) => wanted.has(brand.slug)).map((brand) => brand.id);
}

/** True when a node or any descendant slug is selected. */
export function categoryHasSelectedDescendant(
  node: CatalogCategoryFacet,
  slugs: ReadonlySet<string>,
): boolean {
  if (slugs.has(node.slug)) return true;
  return node.children.some((child) =>
    categoryHasSelectedDescendant(child, slugs),
  );
}

/**
 * Groups selected attribute value ids by attribute.
 * Empty groups are omitted. Used for AND-across / OR-within filtering.
 */
export function groupSelectedAttributeValueIds(
  attributes: readonly CatalogAttributeFacet[],
  selectedValueIds: readonly string[],
): string[][] {
  if (selectedValueIds.length === 0) return [];
  const wanted = new Set(selectedValueIds);
  const groups: string[][] = [];
  for (const attribute of attributes) {
    const matched = attribute.values
      .map((value) => value.id)
      .filter((id) => wanted.has(id));
    if (matched.length > 0) groups.push(matched);
  }
  return groups;
}

/** Resolves legacy `color` hex query values to attribute value ids. */
export function attributeValueIdsForColorHexes(
  attributes: readonly CatalogAttributeFacet[],
  hexes: readonly string[],
): string[] {
  if (hexes.length === 0) return [];
  const wanted = new Set(
    hexes.map((hex) => hex.replace(/^#/, "").toLowerCase()),
  );
  const ids: string[] = [];
  for (const attribute of attributes) {
    for (const value of attribute.values) {
      const hex = value.colorHex?.replace(/^#/, "").toLowerCase();
      if (hex && wanted.has(hex)) ids.push(value.id);
    }
  }
  return ids;
}

/** Merges `attr` ids with legacy `color` hex query values. */
export function mergeCatalogAttributeValueIds(
  attributeValueIds: readonly string[],
  attributes: readonly CatalogAttributeFacet[],
  colorHexes: readonly string[] = [],
): string[] {
  const fromColors = attributeValueIdsForColorHexes(attributes, colorHexes);
  if (fromColors.length === 0) return [...attributeValueIds];
  const seen = new Set(attributeValueIds);
  const merged = [...attributeValueIds];
  for (const id of fromColors) {
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push(id);
  }
  return merged;
}

import type { CatalogBrandFacet } from "@/features/products/domain/catalog-filters";
import type { CatalogPricePresence } from "@/features/products/domain/catalog-sort";

type BrandFacetSource = {
  id: string;
  slug: string;
  title: string;
  imageUrl?: string | null;
};

function withBrandImageUrl(
  brand: Pick<CatalogBrandFacet, "imageUrl">,
): Pick<CatalogBrandFacet, "imageUrl"> {
  return brand.imageUrl ? { imageUrl: brand.imageUrl } : {};
}

/**
 * Builds brand facets with distinct active-product counts for one price mode.
 */
export function buildBrandFacetsWithCounts(
  brands: readonly BrandFacetSource[],
  productIdsByBrandId: ReadonlyMap<string, ReadonlySet<string>>,
): CatalogBrandFacet[] {
  return brands.map((brand) => ({
    id: brand.id,
    slug: brand.slug,
    title: brand.title,
    count: productIdsByBrandId.get(brand.id)?.size ?? 0,
    ...withBrandImageUrl(brand),
  }));
}

/**
 * Keeps brands that have products in either priced or unpriced mode.
 * Display `count` prefers the active mode; when that is 0, shows the other
 * mode's count and sets `forcePricePresence` so selection can switch modes.
 */
export function mergeBrandFacetsByPricePresence(
  activeFacets: readonly CatalogBrandFacet[],
  alternateFacets: readonly CatalogBrandFacet[],
  alternatePresence: CatalogPricePresence,
): CatalogBrandFacet[] {
  const alternateById = new Map(
    alternateFacets.map((facet) => [facet.id, facet]),
  );
  const activeIds = new Set(activeFacets.map((facet) => facet.id));
  const merged: CatalogBrandFacet[] = [];

  for (const active of activeFacets) {
    const node = mergeBrandFacet(
      active,
      alternateById.get(active.id) ?? null,
      alternatePresence,
    );
    if (node) merged.push(node);
  }

  for (const alternate of alternateFacets) {
    if (activeIds.has(alternate.id)) continue;
    const node = mergeBrandFacet(null, alternate, alternatePresence);
    if (node) merged.push(node);
  }

  return merged;
}

/**
 * When selected brands have no products in the active price mode but share a
 * single alternate mode with products, switch listing to that mode.
 */
export function resolvePricePresenceForSelectedBrands(
  brands: readonly CatalogBrandFacet[],
  brandSlugs: readonly string[],
  current: CatalogPricePresence,
): CatalogPricePresence {
  if (brandSlugs.length === 0) return current;
  const wanted = new Set(brandSlugs);
  const selected = brands.filter((brand) => wanted.has(brand.slug));
  if (selected.length === 0) return current;

  const hasActiveModeProducts = selected.some(
    (brand) => brand.count > 0 && brand.forcePricePresence == null,
  );
  if (hasActiveModeProducts) return current;

  const forced = selected
    .map((brand) => brand.forcePricePresence)
    .filter((value): value is CatalogPricePresence => value != null);
  if (forced.length === 0) return current;
  const [first] = forced;
  if (first == null) return current;
  if (forced.every((value) => value === first)) return first;
  return current;
}

/** Finds a brand facet by locale slug. */
export function findBrandFacetBySlug(
  brands: readonly CatalogBrandFacet[],
  slug: string,
): CatalogBrandFacet | null {
  return brands.find((brand) => brand.slug === slug) ?? null;
}

/**
 * Keeps brands that appear on the current product set.
 * Active-mode matches stay selectable in place; alternate-only matches
 * switch listing mode; selected brands stay visible so they can be cleared.
 */
export function restrictBrandFacetsToProductScope(
  brands: readonly CatalogBrandFacet[],
  activeBrandIds: ReadonlySet<string>,
  alternateBrandIds: ReadonlySet<string>,
  alternatePresence: CatalogPricePresence,
  selectedSlugs: readonly string[] = [],
): CatalogBrandFacet[] {
  const selected = new Set(selectedSlugs);
  const scoped: CatalogBrandFacet[] = [];

  for (const brand of brands) {
    const inActive = activeBrandIds.has(brand.id);
    const inAlternate = alternateBrandIds.has(brand.id);
    if (!inActive && !inAlternate && !selected.has(brand.slug)) continue;

    if (inActive) {
      scoped.push({
        id: brand.id,
        slug: brand.slug,
        title: brand.title,
        count: brand.count,
        ...withBrandImageUrl(brand),
      });
      continue;
    }

    if (inAlternate) {
      scoped.push({
        id: brand.id,
        slug: brand.slug,
        title: brand.title,
        count: brand.count,
        forcePricePresence: alternatePresence,
        ...withBrandImageUrl(brand),
      });
      continue;
    }

    scoped.push(brand);
  }

  return scoped;
}

function mergeBrandFacet(
  active: CatalogBrandFacet | null,
  alternate: CatalogBrandFacet | null,
  alternatePresence: CatalogPricePresence,
): CatalogBrandFacet | null {
  if (!active && !alternate) return null;

  const base = active ?? alternate;
  if (!base) return null;

  const activeCount = active?.count ?? 0;
  const alternateCount = alternate?.count ?? 0;
  if (activeCount <= 0 && alternateCount <= 0) return null;

  const usesAlternate = activeCount <= 0 && alternateCount > 0;
  return {
    id: base.id,
    slug: base.slug,
    title: base.title,
    count: usesAlternate ? alternateCount : activeCount,
    ...withBrandImageUrl(base),
    ...(usesAlternate ? { forcePricePresence: alternatePresence } : {}),
  };
}

import { catalogNonColorAttributeFacets } from "@/features/products/domain/catalog-attribute-facets";
import {
  categoryHasSelectedDescendant,
  type CatalogCategoryFacet,
  type CatalogFacets,
} from "@/features/products/domain/catalog-filters";

/** Default shop grid columns at `md` (`grid-2` mode). */
export const CATALOG_GRID_COLUMNS = 3;

/** Minimum product rows on a catalog page when the filter column is short. */
export const CATALOG_MIN_PRODUCT_ROWS = 7;

/**
 * Floor page size. 24 is the existing catalog page (8×3), which already
 * covers the 7-row minimum.
 */
export const CATALOG_MIN_PAGE_SIZE = 24;

/** Safety cap so a very long facet list cannot request an unbounded page. */
export const CATALOG_MAX_PAGE_SIZE = 144;

/** Matches `CATALOG_FILTER_ROW` line-height (`leading-6`). */
const FILTER_ROW_HEIGHT_PX = 24;
/** Matches `CATALOG_FILTER_LIST` / category node `gap-3`. */
const FILTER_ROW_GAP_PX = 12;
/** Section title + `mb-4` / `pb-4` chrome around each filter group. */
const FILTER_SECTION_CHROME_PX = 72;
/** Catalog page title block in the sticky aside. */
const FILTER_TITLE_BLOCK_PX = 80;
/** Price slider body under the section title. */
const FILTER_PRICE_BODY_PX = 56;
const FILTER_COLOR_SWATCHES_PER_ROW = 5;
const FILTER_COLOR_ROW_HEIGHT_PX = 44;

/** Listing toolbar above the product grid. */
const PRODUCT_TOOLBAR_PX = 56;
/** Matches `PRODUCT_CARD_HEIGHT_PX`. */
const PRODUCT_CARD_HEIGHT_PX = 400;
/** Matches catalog grid `gap-y-12`. */
const PRODUCT_ROW_GAP_PX = 48;

function listHeightPx(count: number): number {
  if (count <= 0) return 0;
  return count * FILTER_ROW_HEIGHT_PX + (count - 1) * FILTER_ROW_GAP_PX;
}

function sectionHeightPx(bodyPx: number): number {
  if (bodyPx <= 0) return 0;
  return FILTER_SECTION_CHROME_PX + bodyPx;
}

function visibleCategoryRowCount(
  nodes: readonly CatalogCategoryFacet[],
  selectedSlugs: ReadonlySet<string>,
): number {
  let count = 0;
  function walk(node: CatalogCategoryFacet): void {
    count += 1;
    if (!categoryHasSelectedDescendant(node, selectedSlugs)) return;
    for (const child of node.children) walk(child);
  }
  for (const node of nodes) walk(node);
  return count;
}

function productGridHeightPx(rows: number): number {
  if (rows <= 0) return 0;
  return (
    PRODUCT_TOOLBAR_PX +
    rows * PRODUCT_CARD_HEIGHT_PX +
    (rows - 1) * PRODUCT_ROW_GAP_PX
  );
}

function colorListHeightPx(colorCount: number): number {
  if (colorCount <= 0) return 0;
  const rows = Math.ceil(colorCount / FILTER_COLOR_SWATCHES_PER_ROW);
  return rows * FILTER_COLOR_ROW_HEIGHT_PX;
}

function filterColumnHeightPx(
  facets: CatalogFacets,
  selectedCategorySlugs: readonly string[],
): number {
  const selected = new Set(selectedCategorySlugs);
  let height = FILTER_TITLE_BLOCK_PX;
  height += sectionHeightPx(
    listHeightPx(visibleCategoryRowCount(facets.categories, selected)),
  );
  height += sectionHeightPx(listHeightPx(facets.brands.length));
  if (facets.minPriceAmd != null && facets.maxPriceAmd != null) {
    height += sectionHeightPx(FILTER_PRICE_BODY_PX);
  }
  height += sectionHeightPx(colorListHeightPx(facets.colors.length));
  for (const attribute of catalogNonColorAttributeFacets(facets.attributes)) {
    height += sectionHeightPx(listHeightPx(attribute.values.length));
  }
  return height;
}

/** Clamps a requested catalog page size to the allowed range. */
export function normalizeCatalogPageSize(pageSize: number): number {
  if (!Number.isFinite(pageSize) || pageSize < 1) return CATALOG_MIN_PAGE_SIZE;
  return Math.min(CATALOG_MAX_PAGE_SIZE, Math.floor(pageSize));
}

/**
 * Page size that keeps the product grid at least as tall as the filter
 * column, with a 7-row / 24-item floor.
 */
export function catalogPageSizeForFacets(
  facets: CatalogFacets,
  selectedCategorySlugs: readonly string[] = [],
): number {
  const filterHeight = filterColumnHeightPx(facets, selectedCategorySlugs);
  let rows = CATALOG_MIN_PRODUCT_ROWS;
  while (
    productGridHeightPx(rows) < filterHeight &&
    (rows + 1) * CATALOG_GRID_COLUMNS <= CATALOG_MAX_PAGE_SIZE
  ) {
    rows += 1;
  }
  return normalizeCatalogPageSize(
    Math.max(CATALOG_MIN_PAGE_SIZE, rows * CATALOG_GRID_COLUMNS),
  );
}

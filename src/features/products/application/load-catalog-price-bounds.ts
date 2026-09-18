import "server-only";

import { sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { getDb } from "@/db/client";
import { products } from "@/db/schema";
import {
  catalogFilterCacheKey,
  catalogListWhere,
  type CatalogListFilter,
} from "@/features/products/queries";
import {
  CACHE_TAGS,
  PUBLIC_CACHE_REVALIDATE_SECONDS,
} from "@/lib/cache/tags";

export type CatalogPriceBounds = {
  minPriceAmd: number | null;
  maxPriceAmd: number | null;
};

async function loadCatalogPriceBounds(
  filter?: CatalogListFilter,
): Promise<CatalogPriceBounds> {
  const [row] = await getDb()
    .select({
      minPriceAmd: sql<number | null>`min(${products.priceAmount})::int`,
      maxPriceAmd: sql<number | null>`max(${products.priceAmount})::int`,
    })
    .from(products)
    .where(catalogListWhere(filter));

  return {
    minPriceAmd: row?.minPriceAmd ?? null,
    maxPriceAmd: row?.maxPriceAmd ?? null,
  };
}

/**
 * Min/max AMD prices for products matching catalog filters except the
 * selected price range itself.
 */
export async function getCatalogPriceBoundsForFilter(
  filter?: CatalogListFilter,
): Promise<CatalogPriceBounds> {
  const baseFilter: CatalogListFilter = {
    ...filter,
    minPriceAmd: undefined,
    maxPriceAmd: undefined,
    sort: undefined,
  };
  return unstable_cache(
    async () => loadCatalogPriceBounds(baseFilter),
    ["catalog-price-bounds", catalogFilterCacheKey(baseFilter)],
    {
      tags: [CACHE_TAGS.products],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();
}

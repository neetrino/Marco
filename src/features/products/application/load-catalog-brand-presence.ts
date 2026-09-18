import "server-only";

import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { getDb } from "@/db/client";
import { productBrands, products } from "@/db/schema";
import {
  catalogFilterCacheKey,
  catalogListWhere,
  type CatalogListFilter,
} from "@/features/products/queries";
import {
  CACHE_TAGS,
  PUBLIC_CACHE_REVALIDATE_SECONDS,
} from "@/lib/cache/tags";

export type CatalogBrandPresence = {
  pricedBrandIds: string[];
  unpricedBrandIds: string[];
};

function toBrandPresence(
  rows: readonly { brandId: string; priceAmount: number }[],
): CatalogBrandPresence {
  const priced = new Set<string>();
  const unpriced = new Set<string>();
  for (const row of rows) {
    if (row.priceAmount > 0) priced.add(row.brandId);
    else unpriced.add(row.brandId);
  }
  return {
    pricedBrandIds: [...priced],
    unpricedBrandIds: [...unpriced],
  };
}

async function loadCatalogBrandPresence(
  filter?: CatalogListFilter,
): Promise<CatalogBrandPresence> {
  const rows = await getDb()
    .select({
      brandId: productBrands.brandId,
      priceAmount: products.priceAmount,
    })
    .from(productBrands)
    .innerJoin(products, eq(products.id, productBrands.productId))
    .where(catalogListWhere(filter));

  return toBrandPresence(rows);
}

/**
 * Brand ids on products matching catalog filters except brand and price
 * range, split by priced vs unpriced so the active listing mode can switch.
 */
export async function listCatalogBrandPresence(
  filter?: CatalogListFilter,
): Promise<CatalogBrandPresence> {
  const baseFilter: CatalogListFilter = {
    q: filter?.q,
    categoryIds: filter?.categoryIds,
    attributeValueIdGroups: filter?.attributeValueIdGroups,
  };
  return unstable_cache(
    async () => loadCatalogBrandPresence(baseFilter),
    ["catalog-brand-presence", catalogFilterCacheKey(baseFilter)],
    {
      tags: [CACHE_TAGS.products, CACHE_TAGS.brands],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();
}

import "server-only";

import { eq, inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { getDb } from "@/db/client";
import {
  productVariantAttributeValues,
  productVariants,
  products,
} from "@/db/schema";
import type { ProductAttributeUsage } from "@/features/products/domain/catalog-attribute-facets";
import {
  catalogFilterCacheKey,
  catalogListWhere,
  type CatalogListFilter,
} from "@/features/products/queries";
import {
  CACHE_TAGS,
  PUBLIC_CACHE_REVALIDATE_SECONDS,
} from "@/lib/cache/tags";

function groupVariantValueIds(
  rows: readonly { productId: string; variantId: string; valueId: string }[],
): Map<string, Map<string, string[]>> {
  const byProduct = new Map<string, Map<string, string[]>>();
  for (const row of rows) {
    const variants = byProduct.get(row.productId) ?? new Map<string, string[]>();
    const valueIds = variants.get(row.variantId) ?? [];
    valueIds.push(row.valueId);
    variants.set(row.variantId, valueIds);
    byProduct.set(row.productId, variants);
  }
  return byProduct;
}

function toUsages(
  rows: readonly {
    id: string;
    productType: "SIMPLE" | "VARIABLE";
    attributeValueIds: string[];
  }[],
  variantValues: Map<string, Map<string, string[]>>,
): ProductAttributeUsage[] {
  const usages: ProductAttributeUsage[] = [];
  for (const row of rows) {
    if (row.productType === "VARIABLE") {
      const variants = variantValues.get(row.id);
      const usage: ProductAttributeUsage = {
        simpleValueIds: [],
        variants: variants
          ? [...variants.values()].map((valueIds) => ({ valueIds }))
          : [],
      };
      if (usage.variants.length > 0) usages.push(usage);
      continue;
    }
    const simpleValueIds = row.attributeValueIds.filter(
      (id) => id.length > 0,
    );
    if (simpleValueIds.length > 0) {
      usages.push({ simpleValueIds, variants: [] });
    }
  }
  return usages;
}

async function loadCatalogProductAttributeUsages(
  filter?: CatalogListFilter,
): Promise<ProductAttributeUsage[]> {
  const productRows = await getDb()
    .select({
      id: products.id,
      productType: products.productType,
      attributeValueIds: products.attributeValueIds,
    })
    .from(products)
    .where(catalogListWhere(filter));

  const variableIds = productRows
    .filter((row) => row.productType === "VARIABLE")
    .map((row) => row.id);

  const variantRows =
    variableIds.length === 0
      ? []
      : await getDb()
          .select({
            productId: productVariants.productId,
            variantId: productVariants.id,
            valueId: productVariantAttributeValues.attributeValueId,
          })
          .from(productVariantAttributeValues)
          .innerJoin(
            productVariants,
            eq(productVariants.id, productVariantAttributeValues.variantId),
          )
          .where(inArray(productVariants.productId, variableIds));

  return toUsages(productRows, groupVariantValueIds(variantRows));
}

/**
 * Attribute assignments for products matching catalog filters except
 * selected attribute values (those are applied in-memory per facet).
 */
export async function listCatalogProductAttributeUsages(
  filter?: CatalogListFilter,
): Promise<ProductAttributeUsage[]> {
  const baseFilter: CatalogListFilter = {
    ...filter,
    attributeValueIdGroups: undefined,
    sort: undefined,
  };
  return unstable_cache(
    async () => loadCatalogProductAttributeUsages(baseFilter),
    ["catalog-attribute-usages", catalogFilterCacheKey(baseFilter)],
    {
      tags: [CACHE_TAGS.products],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();
}

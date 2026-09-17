import "server-only";

import { and, ne, or, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import { products, type TranslationsJson } from "@/db/schema";
import { createId } from "@/lib/id";
import { slugifyProductTitle } from "@/features/products/domain/product-specs";
import { nextUniqueProductSlug } from "@/features/products/domain/unique-product-slug";

function slugsFromTranslations(translations: TranslationsJson): string[] {
  const values = [
    translations.hy?.slug,
    translations.en?.slug,
    translations.ru?.slug,
  ];
  return values.filter((slug): slug is string => Boolean(slug));
}

function slugCollisionWhere(base: string) {
  const prefix = `${base}-%`;
  return or(
    sql`${products.translations}->'hy'->>'slug' = ${base}`,
    sql`${products.translations}->'hy'->>'slug' LIKE ${prefix}`,
    sql`${products.translations}->'en'->>'slug' = ${base}`,
    sql`${products.translations}->'en'->>'slug' LIKE ${prefix}`,
    sql`${products.translations}->'ru'->>'slug' = ${base}`,
    sql`${products.translations}->'ru'->>'slug' LIKE ${prefix}`,
  );
}

async function listTakenProductSlugs(
  base: string,
  excludeProductId?: string,
): Promise<Set<string>> {
  const collision = slugCollisionWhere(base);
  const rows = await getDb()
    .select({ translations: products.translations })
    .from(products)
    .where(
      excludeProductId
        ? and(ne(products.id, excludeProductId), collision)
        : collision,
    );

  const taken = new Set<string>();
  for (const row of rows) {
    for (const slug of slugsFromTranslations(row.translations)) {
      taken.add(slug);
    }
  }
  return taken;
}

/** Returns a unique product slug: same name stays the same, else `-1`, `-2`, … */
export async function allocateUniqueProductSlug(
  desired: string,
  excludeProductId?: string,
): Promise<string> {
  const base = slugifyProductTitle(desired);
  const taken = await listTakenProductSlugs(base, excludeProductId);
  const unique = nextUniqueProductSlug(base, taken);
  if (!taken.has(unique)) return unique;
  return slugifyProductTitle(`${base}-${createId().slice(0, 8)}`);
}

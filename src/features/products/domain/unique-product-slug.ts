import {
  PRODUCT_SLUG_MAX_LENGTH,
  slugifyProductTitle,
} from "@/features/products/domain/product-specs";

const MAX_NUMERIC_SUFFIX = 9_999;

function productSlugWithIndex(base: string, index: number): string {
  const suffix = `-${index}`;
  const room = PRODUCT_SLUG_MAX_LENGTH - suffix.length;
  const root = (base.slice(0, Math.max(1, room)) || "product").replace(
    /-+$/g,
    "",
  );
  return `${root || "product"}${suffix}`;
}

/**
 * Returns the slugified name, or `name-1`, `name-2`, … if that slug is taken.
 */
export function nextUniqueProductSlug(
  desired: string,
  taken: ReadonlySet<string>,
): string {
  const base = slugifyProductTitle(desired);
  if (!taken.has(base)) return base;

  for (let index = 1; index <= MAX_NUMERIC_SUFFIX; index += 1) {
    const candidate = productSlugWithIndex(base, index);
    if (!taken.has(candidate)) return candidate;
  }

  return productSlugWithIndex(base, MAX_NUMERIC_SUFFIX);
}

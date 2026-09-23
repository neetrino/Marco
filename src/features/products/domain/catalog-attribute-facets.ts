import type {
  CatalogAttributeFacet,
  CatalogAttributeValueFacet,
  CatalogColorFacet,
} from "@/features/products/domain/catalog-filters";

export type ProductAttributeUsage = {
  simpleValueIds: readonly string[];
  variants: readonly { valueIds: readonly string[] }[];
};

/**
 * Leading number in a filter label (e.g. "650", "800 Վտ", "1,5 kg").
 * Used so numeric attribute options sort as 100 → 650 → 800, not by insert order.
 */
export function parseCatalogAttributeValueNumber(title: string): number | null {
  const match = title.trim().match(/^(\d+(?:[.,]\d+)?)/);
  if (!match?.[1]) return null;
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

/**
 * Sorts attribute filter values for the storefront.
 * Fully numeric labels (optional unit) sort by number; otherwise locale-aware A→Z.
 */
export function sortCatalogAttributeValues<
  T extends Pick<CatalogAttributeValueFacet, "title">,
>(values: readonly T[]): T[] {
  if (values.length <= 1) return [...values];

  const numbers = values.map((value) =>
    parseCatalogAttributeValueNumber(value.title),
  );
  if (numbers.every((value) => value != null)) {
    return values
      .map((value, index) => ({ value, number: numbers[index]! }))
      .sort((left, right) => {
        if (left.number !== right.number) return left.number - right.number;
        return left.value.title.localeCompare(right.value.title, undefined, {
          sensitivity: "base",
        });
      })
      .map(({ value }) => value);
  }

  return [...values].sort((left, right) =>
    left.title.localeCompare(right.title, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
}

/** Maps each attribute value id to its parent attribute id. */
export function catalogAttributeIdByValueId(
  attributes: readonly CatalogAttributeFacet[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const attribute of attributes) {
    for (const value of attribute.values) {
      map.set(value.id, attribute.id);
    }
  }
  return map;
}

function groupAttributeId(
  group: readonly string[],
  attributeIdByValueId: ReadonlyMap<string, string>,
): string | null {
  const first = group[0];
  if (first == null) return null;
  return attributeIdByValueId.get(first) ?? null;
}

function valueIdsMatchGroups(
  valueIds: readonly string[],
  groups: readonly (readonly string[])[],
): boolean {
  if (groups.length === 0) return true;
  const present = new Set(valueIds);
  return groups.every((group) => group.some((id) => present.has(id)));
}

function addValuesForAttribute(
  valueIds: readonly string[],
  attributeId: string,
  attributeIdByValueId: ReadonlyMap<string, string>,
  used: Set<string>,
): void {
  for (const valueId of valueIds) {
    if (attributeIdByValueId.get(valueId) === attributeId) used.add(valueId);
  }
}

function collectFromProduct(
  product: ProductAttributeUsage,
  attributeId: string,
  groupsExceptThis: readonly (readonly string[])[],
  attributeIdByValueId: ReadonlyMap<string, string>,
  used: Set<string>,
): void {
  if (product.variants.length > 0) {
    for (const variant of product.variants) {
      if (!valueIdsMatchGroups(variant.valueIds, groupsExceptThis)) continue;
      addValuesForAttribute(
        variant.valueIds,
        attributeId,
        attributeIdByValueId,
        used,
      );
    }
    return;
  }
  if (!valueIdsMatchGroups(product.simpleValueIds, groupsExceptThis)) return;
  addValuesForAttribute(
    product.simpleValueIds,
    attributeId,
    attributeIdByValueId,
    used,
  );
}

/**
 * Attribute values used by the current catalog set.
 * Each attribute ignores its own selected values so sibling options stay visible.
 */
export function collectUsedAttributeValueIds(
  products: readonly ProductAttributeUsage[],
  attributeIdByValueId: ReadonlyMap<string, string>,
  selectedGroups: readonly (readonly string[])[],
): Set<string> {
  const used = new Set<string>();
  const attributeIds = new Set(attributeIdByValueId.values());
  for (const attributeId of attributeIds) {
    const groupsExceptThis = selectedGroups.filter(
      (group) => groupAttributeId(group, attributeIdByValueId) !== attributeId,
    );
    for (const product of products) {
      collectFromProduct(
        product,
        attributeId,
        groupsExceptThis,
        attributeIdByValueId,
        used,
      );
    }
  }
  return used;
}

/** Keeps used values, plus any currently selected ids so they stay un-selectable. */
export function restrictCatalogAttributeFacets(
  attributes: readonly CatalogAttributeFacet[],
  usedValueIds: ReadonlySet<string>,
  selectedValueIds: readonly string[] = [],
): CatalogAttributeFacet[] {
  const keep = new Set(usedValueIds);
  for (const id of selectedValueIds) keep.add(id);

  return attributes.flatMap((attribute) => {
    const values = sortCatalogAttributeValues(
      attribute.values.filter((value) => keep.has(value.id)),
    );
    return values.length > 0 ? [{ ...attribute, values }] : [];
  });
}

/** Color swatches derived from attribute values that have a hex. */
export function colorFacetsFromAttributes(
  attributes: readonly CatalogAttributeFacet[],
): CatalogColorFacet[] {
  const colors: CatalogColorFacet[] = [];
  const seenHex = new Set<string>();
  for (const attribute of attributes) {
    for (const value of attribute.values) {
      if (!value.colorHex || seenHex.has(value.colorHex)) continue;
      seenHex.add(value.colorHex);
      colors.push({ id: value.id, hex: value.colorHex });
    }
  }
  return colors;
}

/** Checkbox attributes: values without a color swatch (size, width, …). */
export function catalogNonColorAttributeFacets(
  attributes: readonly CatalogAttributeFacet[],
): CatalogAttributeFacet[] {
  return attributes.flatMap((attribute) => {
    const values = sortCatalogAttributeValues(
      attribute.values.filter((value) => value.colorHex == null),
    );
    return values.length > 0 ? [{ ...attribute, values }] : [];
  });
}

export function toDisplayAttributeFacets(
  attributes: readonly CatalogAttributeFacet[],
  usedValueIds: ReadonlySet<string>,
  selectedValueIds: readonly string[],
): { attributes: CatalogAttributeFacet[]; colors: CatalogColorFacet[] } {
  const scoped = restrictCatalogAttributeFacets(
    attributes,
    usedValueIds,
    selectedValueIds,
  );
  return {
    attributes: scoped,
    colors: colorFacetsFromAttributes(scoped),
  };
}

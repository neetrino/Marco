import { describe, expect, it } from "vitest";

import {
  catalogAttributeIdByValueId,
  catalogNonColorAttributeFacets,
  collectUsedAttributeValueIds,
  colorFacetsFromAttributes,
  parseCatalogAttributeValueNumber,
  restrictCatalogAttributeFacets,
  sortCatalogAttributeValues,
  type ProductAttributeUsage,
} from "@/features/products/domain/catalog-attribute-facets";
import type { CatalogAttributeFacet } from "@/features/products/domain/catalog-filters";

const attributes: CatalogAttributeFacet[] = [
  {
    id: "color",
    key: "color",
    title: "Color",
    values: [
      { id: "black", title: "Black", colorHex: "000000" },
      { id: "white", title: "White", colorHex: "ffffff" },
    ],
  },
  {
    id: "size",
    key: "size",
    title: "Size",
    values: [
      { id: "m", title: "M", colorHex: null },
      { id: "l", title: "L", colorHex: null },
    ],
  },
  {
    id: "width",
    key: "width",
    title: "Width",
    values: [
      { id: "60", title: "60 cm", colorHex: null },
      { id: "90", title: "90 cm", colorHex: null },
    ],
  },
];

const valueAttributeIds = catalogAttributeIdByValueId(attributes);

describe("collectUsedAttributeValueIds", () => {
  const variableProduct: ProductAttributeUsage = {
    simpleValueIds: [],
    variants: [
      { valueIds: ["black", "m"] },
      { valueIds: ["white", "l"] },
    ],
  };
  const hoodProduct: ProductAttributeUsage = {
    simpleValueIds: ["black", "60"],
    variants: [],
  };

  it("returns every value used by the current products, not only size", () => {
    const used = collectUsedAttributeValueIds(
      [variableProduct, hoodProduct],
      valueAttributeIds,
      [],
    );
    expect(used).toEqual(new Set(["black", "white", "m", "l", "60"]));
  });

  it("limits other attributes to variants that match the selected color", () => {
    const used = collectUsedAttributeValueIds(
      [variableProduct, hoodProduct],
      valueAttributeIds,
      [["black"]],
    );
    expect(used.has("m")).toBe(true);
    expect(used.has("60")).toBe(true);
    expect(used.has("l")).toBe(false);
    expect(used.has("90")).toBe(false);
  });

  it("keeps sibling sizes when a size is selected", () => {
    const used = collectUsedAttributeValueIds(
      [variableProduct],
      valueAttributeIds,
      [["m"]],
    );
    expect(used.has("m")).toBe(true);
    expect(used.has("l")).toBe(true);
  });

  it("hides unused attributes when the product set does not use them", () => {
    const used = collectUsedAttributeValueIds(
      [hoodProduct],
      valueAttributeIds,
      [],
    );
    expect(used.has("60")).toBe(true);
    expect(used.has("m")).toBe(false);
    expect(used.has("l")).toBe(false);
  });
});

describe("restrictCatalogAttributeFacets", () => {
  it("drops attributes and values the current products do not use", () => {
    const scoped = restrictCatalogAttributeFacets(
      attributes,
      new Set(["black", "60"]),
    );
    expect(scoped.map((attribute) => attribute.key)).toEqual(["color", "width"]);
    expect(scoped[1]?.values.map((value) => value.id)).toEqual(["60"]);
  });

  it("keeps a selected value even when it is no longer used", () => {
    const scoped = restrictCatalogAttributeFacets(
      attributes,
      new Set(["60"]),
      ["m"],
    );
    expect(scoped.some((attribute) => attribute.key === "size")).toBe(true);
  });

  it("sorts numeric attribute values ascending", () => {
    const power: CatalogAttributeFacet[] = [
      {
        id: "power",
        key: "power",
        title: "Շարժիչի հզորություն (Վտ)",
        values: [
          { id: "650", title: "650", colorHex: null },
          { id: "800", title: "800", colorHex: null },
          { id: "100", title: "100", colorHex: null },
        ],
      },
    ];
    const scoped = restrictCatalogAttributeFacets(
      power,
      new Set(["650", "800", "100"]),
    );
    expect(scoped[0]?.values.map((value) => value.title)).toEqual([
      "100",
      "650",
      "800",
    ]);
  });
});

describe("colorFacetsFromAttributes", () => {
  it("dedupes hex swatches", () => {
    expect(colorFacetsFromAttributes(attributes)).toEqual([
      { id: "black", hex: "000000" },
      { id: "white", hex: "ffffff" },
    ]);
  });
});

describe("catalogNonColorAttributeFacets", () => {
  it("exposes every non-color attribute, not a hardcoded size list", () => {
    const text = catalogNonColorAttributeFacets(attributes);
    expect(text.map((attribute) => attribute.key)).toEqual(["size", "width"]);
  });

  it("sorts size labels alphabetically for display", () => {
    const text = catalogNonColorAttributeFacets(attributes);
    const size = text.find((attribute) => attribute.key === "size");
    expect(size?.values.map((value) => value.title)).toEqual(["L", "M"]);
  });
});

describe("parseCatalogAttributeValueNumber", () => {
  it("reads a leading number and ignores a unit suffix", () => {
    expect(parseCatalogAttributeValueNumber("650")).toBe(650);
    expect(parseCatalogAttributeValueNumber("800 Վտ")).toBe(800);
    expect(parseCatalogAttributeValueNumber("1,5 kg")).toBe(1.5);
    expect(parseCatalogAttributeValueNumber("M")).toBeNull();
  });
});

describe("sortCatalogAttributeValues", () => {
  it("orders fully numeric labels ascending", () => {
    const sorted = sortCatalogAttributeValues([
      { id: "a", title: "650", colorHex: null },
      { id: "b", title: "800", colorHex: null },
      { id: "c", title: "100", colorHex: null },
    ]);
    expect(sorted.map((value) => value.title)).toEqual(["100", "650", "800"]);
  });

  it("orders numeric labels that include units", () => {
    const sorted = sortCatalogAttributeValues([
      { id: "a", title: "90 cm", colorHex: null },
      { id: "b", title: "60 cm", colorHex: null },
      { id: "c", title: "120 cm", colorHex: null },
    ]);
    expect(sorted.map((value) => value.title)).toEqual([
      "60 cm",
      "90 cm",
      "120 cm",
    ]);
  });

  it("orders non-numeric labels alphabetically", () => {
    const sorted = sortCatalogAttributeValues([
      { id: "a", title: "White", colorHex: null },
      { id: "b", title: "Black", colorHex: null },
    ]);
    expect(sorted.map((value) => value.title)).toEqual(["Black", "White"]);
  });
});

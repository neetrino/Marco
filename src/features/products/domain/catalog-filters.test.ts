import { describe, expect, it } from "vitest";

import {
  attributeValueIdsForColorHexes,
  categoryHasSelectedDescendant,
  collectBrandIdsForSlugs,
  collectCategoryIdsForSlugs,
  groupSelectedAttributeValueIds,
  mergeCatalogAttributeValueIds,
  type CatalogAttributeFacet,
  type CatalogBrandFacet,
  type CatalogCategoryFacet,
} from "@/features/products/domain/catalog-filters";

const tree: CatalogCategoryFacet[] = [
  {
    id: "kitchen",
    slug: "kitchen",
    title: "Kitchen",
    count: 10,
    children: [
      {
        id: "hoods",
        slug: "hoods",
        title: "Hoods",
        count: 4,
        children: [],
      },
    ],
  },
];

describe("collectCategoryIdsForSlugs", () => {
  it("includes descendants when a parent slug is selected", () => {
    expect(collectCategoryIdsForSlugs(tree, ["kitchen"])).toEqual([
      "kitchen",
      "hoods",
    ]);
  });

  it("selects a child without the parent", () => {
    expect(collectCategoryIdsForSlugs(tree, ["hoods"])).toEqual(["hoods"]);
  });
});

describe("collectBrandIdsForSlugs", () => {
  const brands: CatalogBrandFacet[] = [
    { id: "b1", slug: "lex", title: "Lex", count: 1 },
    { id: "b2", slug: "aux", title: "AUX", count: 2 },
  ];

  it("maps selected slugs to brand ids", () => {
    expect(collectBrandIdsForSlugs(brands, ["aux"])).toEqual(["b2"]);
  });
});

describe("categoryHasSelectedDescendant", () => {
  it("detects a selected nested slug", () => {
    expect(categoryHasSelectedDescendant(tree[0]!, new Set(["hoods"]))).toBe(
      true,
    );
    expect(categoryHasSelectedDescendant(tree[0]!, new Set(["other"]))).toBe(
      false,
    );
  });
});

describe("groupSelectedAttributeValueIds", () => {
  const attributes: CatalogAttributeFacet[] = [
    {
      id: "color",
      key: "color",
      title: "Color",
      values: [
        { id: "red", title: "Red", colorHex: "ff0000" },
        { id: "blue", title: "Blue", colorHex: "0000ff" },
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
  ];

  it("groups selected values by attribute for AND/OR filtering", () => {
    expect(
      groupSelectedAttributeValueIds(attributes, ["red", "l", "blue"]),
    ).toEqual([
      ["red", "blue"],
      ["l"],
    ]);
  });
});

describe("attributeValueIdsForColorHexes", () => {
  const attributes: CatalogAttributeFacet[] = [
    {
      id: "color",
      key: "color",
      title: "Color",
      values: [
        { id: "red", title: "Red", colorHex: "ff0000" },
        { id: "blue", title: "Blue", colorHex: "0000ff" },
      ],
    },
  ];

  it("maps hex filters to attribute value ids", () => {
    expect(attributeValueIdsForColorHexes(attributes, ["0000ff"])).toEqual([
      "blue",
    ]);
  });
});

describe("mergeCatalogAttributeValueIds", () => {
  const attributes: CatalogAttributeFacet[] = [
    {
      id: "color",
      key: "color",
      title: "Color",
      values: [
        { id: "red", title: "Red", colorHex: "ff0000" },
        { id: "blue", title: "Blue", colorHex: "0000ff" },
      ],
    },
  ];

  it("appends unresolved color hexes as attribute ids", () => {
    expect(
      mergeCatalogAttributeValueIds(["red"], attributes, ["0000ff"]),
    ).toEqual(["red", "blue"]);
  });
});

import { describe, expect, it } from "vitest";

import { catalogFilterSectionOrder } from "@/features/products/domain/catalog-filter-section-order";

describe("catalogFilterSectionOrder", () => {
  it("keeps category, brand, and price first in the sidebar", () => {
    expect(catalogFilterSectionOrder("sidebar")).toEqual([
      "categories",
      "brands",
      "price",
      "colors",
      "attributes",
    ]);
  });

  it("moves category, price, and brand below other filters in the drawer", () => {
    expect(catalogFilterSectionOrder("drawer")).toEqual([
      "colors",
      "attributes",
      "categories",
      "price",
      "brands",
    ]);
  });
});

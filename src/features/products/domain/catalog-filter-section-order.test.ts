import { describe, expect, it } from "vitest";

import { catalogFilterSectionOrder } from "@/features/products/domain/catalog-filter-section-order";

describe("catalogFilterSectionOrder", () => {
  it("puts brand above price and category last on desktop and mobile", () => {
    expect(catalogFilterSectionOrder()).toEqual([
      "brands",
      "price",
      "colors",
      "attributes",
      "categories",
    ]);
  });
});

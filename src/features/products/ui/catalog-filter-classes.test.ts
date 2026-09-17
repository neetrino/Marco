import { describe, expect, it } from "vitest";

import {
  CATALOG_FILTER_ASIDE,
  CATALOG_FILTER_LIST,
  catalogFilterBrandLabelClass,
  catalogFilterCategoryLabelClass,
  catalogFilterCheckIconClass,
  catalogFilterCheckboxToneClass,
  catalogPricePresenceSegmentClass,
  catalogViewToggleSegmentClass,
} from "@/features/products/ui/catalog-filter-classes";

describe("catalog filter classes", () => {
  it("lets filter lists grow with the page instead of scrolling internally", () => {
    expect(CATALOG_FILTER_LIST).not.toContain("overflow-y-auto");
    expect(CATALOG_FILTER_LIST).not.toContain("max-h-");
    expect(CATALOG_FILTER_ASIDE).not.toContain("max-h-");
    expect(CATALOG_FILTER_ASIDE).not.toContain("sticky");
  });

  it("uses marco-slate for category labels and keeps top-level rows semibold", () => {
    expect(catalogFilterCategoryLabelClass(true, true)).toContain("text-marco-slate");
    expect(catalogFilterCategoryLabelClass(false, true)).toContain("font-semibold");
    expect(catalogFilterCategoryLabelClass(false, false)).toContain("font-normal");
  });

  it("keeps brand labels in marco-slate and emphasizes the selected row", () => {
    expect(catalogFilterBrandLabelClass(true)).toContain("font-semibold");
    expect(catalogFilterBrandLabelClass(false)).toContain("font-normal");
    expect(catalogFilterBrandLabelClass(false)).toContain("text-marco-slate");
  });

  it("keeps category checks outlined and brand checks filled", () => {
    expect(catalogFilterCheckboxToneClass(true, "checkmark")).toContain("bg-white");
    expect(catalogFilterCheckboxToneClass(true, "filled")).toContain("bg-marco-ink");
    expect(catalogFilterCheckIconClass("checkmark")).toContain("text-marco-ink");
    expect(catalogFilterCheckIconClass("filled")).toContain("text-white");
  });

  it("highlights active toolbar pills in light gray", () => {
    expect(catalogPricePresenceSegmentClass(true, true)).toContain("bg-marco-gray");
    expect(catalogPricePresenceSegmentClass(true, true)).toContain("text-marco-slate");
    expect(catalogPricePresenceSegmentClass(false, true)).toContain("text-marco-black/80");
    expect(catalogViewToggleSegmentClass(true)).toContain("bg-marco-gray");
    expect(catalogViewToggleSegmentClass(true)).toContain("text-marco-slate");
    expect(catalogViewToggleSegmentClass(false)).toContain("bg-white");
  });
});

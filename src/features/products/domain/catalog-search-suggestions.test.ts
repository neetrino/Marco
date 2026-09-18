import { describe, expect, it } from "vitest";

import {
  mapCatalogSearchSuggestion,
  nextSuggestionIndex,
  resolveHeaderSearchKeyAction,
} from "@/features/products/domain/catalog-search-suggestions";

const product = {
  id: "p1",
  priceAmount: 12_500,
  imageUrl: "https://cdn.example/p1.webp",
  translation: { title: "Hisense TV", slug: "hisense-tv" },
};

describe("mapCatalogSearchSuggestion", () => {
  it("builds a product href and keeps a priced row", () => {
    expect(mapCatalogSearchSuggestion(product, "hy", "12 500 AMD")).toEqual({
      id: "p1",
      href: "/hy/products/hisense-tv",
      title: "Hisense TV",
      imageUrl: "https://cdn.example/p1.webp",
      priceFormatted: "12 500 AMD",
    });
  });

  it("hides price when the catalog amount is zero", () => {
    const mapped = mapCatalogSearchSuggestion(
      { ...product, priceAmount: 0 },
      "en",
      "0 AMD",
    );
    expect(mapped.priceFormatted).toBeNull();
    expect(mapped.href).toBe("/en/products/hisense-tv");
  });
});

describe("nextSuggestionIndex", () => {
  it("enters the list from the input and wraps at the edges", () => {
    expect(nextSuggestionIndex(-1, 3, 1)).toBe(0);
    expect(nextSuggestionIndex(-1, 3, -1)).toBe(2);
    expect(nextSuggestionIndex(2, 3, 1)).toBe(0);
    expect(nextSuggestionIndex(0, 3, -1)).toBe(2);
    expect(nextSuggestionIndex(0, 0, 1)).toBe(-1);
  });
});

describe("resolveHeaderSearchKeyAction", () => {
  it("highlights, closes, and navigates from the open typeahead", () => {
    expect(
      resolveHeaderSearchKeyAction({
        key: "ArrowDown",
        open: true,
        activeIndex: -1,
        itemCount: 2,
        activeHref: undefined,
      }),
    ).toEqual({ type: "highlight", index: 0 });
    expect(
      resolveHeaderSearchKeyAction({
        key: "Escape",
        open: true,
        activeIndex: 0,
        itemCount: 2,
        activeHref: "/hy/products/a",
      }),
    ).toEqual({ type: "close" });
    expect(
      resolveHeaderSearchKeyAction({
        key: "Enter",
        open: true,
        activeIndex: 0,
        itemCount: 2,
        activeHref: "/hy/products/a",
      }),
    ).toEqual({ type: "navigate", href: "/hy/products/a" });
    expect(
      resolveHeaderSearchKeyAction({
        key: "Enter",
        open: true,
        activeIndex: -1,
        itemCount: 2,
        activeHref: undefined,
      }),
    ).toEqual({ type: "none" });
  });
});

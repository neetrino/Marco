import { describe, expect, it } from "vitest";

import {
  catalogHref,
  withCatalogPricePresence,
} from "@/features/products/domain/catalog-href";
import { parseCatalogSearchParams } from "@/features/products/domain/catalog-search-params";

describe("parseCatalogSearchParams", () => {
  it("returns defaults for empty params", () => {
    expect(parseCatalogSearchParams({})).toEqual({
      page: 1,
      q: null,
      categorySlugs: [],
      brandSlugs: [],
      colorHexes: [],
      attributeValueIds: [],
      minPrice: null,
      maxPrice: null,
      sort: "default",
      pricePresence: "with",
    });
  });

  it("parses repeated and comma-separated filter values", () => {
    expect(
      parseCatalogSearchParams({
        q: "  sofa  ",
        category: ["hoods", "ovens,hoods"],
        brand: "lex",
        color: ["#FFCA03", "000000"],
        attr: [
          "11111111-1111-1111-1111-111111111111",
          "22222222-2222-2222-2222-222222222222,bad",
          "cmobkyy780039765lvlfq7q0y",
        ],
        minPrice: "7",
        maxPrice: "4975",
        page: "2",
        sort: "price-asc",
        pricePresence: "without",
      }),
    ).toEqual({
      page: 2,
      q: "sofa",
      categorySlugs: ["hoods", "ovens"],
      brandSlugs: ["lex"],
      colorHexes: ["ffca03", "000000"],
      attributeValueIds: [
        "11111111-1111-1111-1111-111111111111",
        "22222222-2222-2222-2222-222222222222",
        "cmobkyy780039765lvlfq7q0y",
      ],
      minPrice: 7,
      maxPrice: 4975,
      sort: "price-asc",
      pricePresence: "without",
    });
  });

  it("swaps inverted price bounds and ignores invalid values", () => {
    expect(
      parseCatalogSearchParams({
        minPrice: "90",
        maxPrice: "10",
        color: "red",
        attr: "not-a-uuid",
        page: "0",
        q: "   ",
      }),
    ).toEqual({
      page: 1,
      q: null,
      categorySlugs: [],
      brandSlugs: [],
      colorHexes: [],
      attributeValueIds: [],
      minPrice: 10,
      maxPrice: 90,
      sort: "default",
      pricePresence: "with",
    });
  });
});

describe("catalogHref", () => {
  it("omits the default page and empty filters", () => {
    expect(
      catalogHref("hy", {
        page: 1,
        q: null,
        categorySlugs: [],
        brandSlugs: [],
        colorHexes: [],
        attributeValueIds: [],
        minPrice: null,
        maxPrice: null,
        sort: "default",
        pricePresence: "with",
      }),
    ).toBe("/hy/products");
  });

  it("serializes selected filters", () => {
    expect(
      catalogHref("hy", {
        page: 2,
        q: "hood",
        categorySlugs: ["hoods"],
        brandSlugs: ["lex"],
        colorHexes: [],
        attributeValueIds: ["11111111-1111-1111-1111-111111111111"],
        minPrice: 7,
        maxPrice: 4975,
        sort: "name-desc",
        pricePresence: "without",
      }),
    ).toBe(
      "/hy/products?q=hood&category=hoods&brand=lex&attr=11111111-1111-1111-1111-111111111111&minPrice=7&maxPrice=4975&sort=name-desc&pricePresence=without&page=2",
    );
  });
});

describe("withCatalogPricePresence", () => {
  it("drops the price range when switching to products without a price", () => {
    expect(
      withCatalogPricePresence(
        {
          page: 3,
          q: null,
          categorySlugs: [],
          brandSlugs: [],
          colorHexes: [],
          attributeValueIds: [],
          minPrice: 7,
          maxPrice: 4975,
          sort: "default",
          pricePresence: "with",
        },
        "without",
      ),
    ).toMatchObject({
      page: 1,
      pricePresence: "without",
      minPrice: null,
      maxPrice: null,
    });
  });
});

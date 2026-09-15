import { describe, expect, it } from "vitest";

import { mapProductCards } from "@/features/products/map-product-cards";
import type { CatalogProduct } from "@/features/products/types";
import type { DisplayPrice } from "@/lib/money/display-price";

const warrantyLabels = {
  warranty1: "1",
  warranty2: "2",
  warranty3: "3",
  warrantyBadge: "Warranty",
  warrantyYearsSuffix: "y",
  sku: "SKU",
};

function formatPrice(amount: number): DisplayPrice {
  return {
    baseAmount: amount,
    baseCurrency: "AMD",
    displayAmount: BigInt(amount),
    displayCurrency: "AMD",
    rate: "1",
    rateSource: "test",
    formatted: `${amount} AMD`,
  };
}

function product(
  overrides: Partial<CatalogProduct> & Pick<CatalogProduct, "id">,
): CatalogProduct {
  return {
    sku: "SKU-1",
    listPriceAmount: 10_000,
    priceAmount: 8_000,
    compareAtAmount: 10_000,
    discountPercent: null,
    stockOnHand: 1,
    translation: { title: "Test", slug: "test" },
    imageUrl: null,
    brandLogoUrl: null,
    brandName: null,
    warrantyYears: 0,
    tags: [],
    ...overrides,
  };
}

describe("mapProductCards", () => {
  it("derives discount badge percent from compare-at when missing", () => {
    const [card] = mapProductCards(
      [product({ id: "p1" })],
      "hy",
      formatPrice,
      warrantyLabels,
      new Set(),
    );
    expect(card).toBeDefined();
    if (!card) return;

    expect(card.discountPercent).toBe(20);
    expect(card.compareAtFormatted).toBe("10000 AMD");
  });

  it("keeps explicit discountPercent from pricing resolution", () => {
    const [card] = mapProductCards(
      [product({ id: "p2", discountPercent: 15, priceAmount: 8_500 })],
      "hy",
      formatPrice,
      warrantyLabels,
      new Set(),
    );
    expect(card).toBeDefined();
    if (!card) return;

    expect(card.discountPercent).toBe(15);
  });

  it("omits price and discount when priceAmount is 0", () => {
    const [card] = mapProductCards(
      [
        product({
          id: "p3",
          priceAmount: 0,
          compareAtAmount: 10_000,
          discountPercent: 20,
        }),
      ],
      "hy",
      formatPrice,
      warrantyLabels,
      new Set(),
    );
    expect(card).toBeDefined();
    if (!card) return;

    expect(card.priceFormatted).toBeNull();
    expect(card.compareAtFormatted).toBeNull();
    expect(card.discountPercent).toBeNull();
  });
});

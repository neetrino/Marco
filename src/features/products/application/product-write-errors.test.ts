import { describe, expect, it } from "vitest";

import {
  isNavigationControlError,
  productWriteErrorMessage,
} from "@/features/products/application/product-write-errors";

describe("productWriteErrorMessage", () => {
  it("maps duplicate SKU constraint text", () => {
    expect(
      productWriteErrorMessage(
        new Error('duplicate key value violates unique constraint "products_sku_uidx"'),
      ),
    ).toBe("A product with this SKU already exists.");
  });

  it("maps duplicate slug constraint text from a nested cause", () => {
    const error = new Error("insert failed");
    error.cause = { constraint: "products_slug_hy_uidx", code: "23505" };
    expect(productWriteErrorMessage(error)).toBe(
      "A product with this slug already exists.",
    );
  });

  it("returns a generic message for unknown failures", () => {
    expect(productWriteErrorMessage(new Error("connection reset"))).toBe(
      "Unable to save product.",
    );
  });
});

describe("isNavigationControlError", () => {
  it("detects Next.js redirect digests", () => {
    expect(
      isNavigationControlError({ digest: "NEXT_REDIRECT;replace;/hy/login;307;" }),
    ).toBe(true);
  });

  it("ignores ordinary errors", () => {
    expect(isNavigationControlError(new Error("boom"))).toBe(false);
  });
});

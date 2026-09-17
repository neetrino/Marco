import { describe, expect, it } from "vitest";

import { resolveProductPrimaryImageId } from "@/features/products/domain/product-media-primary";

describe("resolveProductPrimaryImageId", () => {
  it("uses a newly uploaded primary when its index is valid", () => {
    expect(
      resolveProductPrimaryImageId({
        createdIds: ["new-a", "new-b"],
        primaryNewIndex: 1,
        primaryExistingId: "old-primary",
        removeImageIds: [],
        remaining: [{ id: "old-primary", isPrimary: true }],
      }),
    ).toBe("new-b");
  });

  it("keeps the current primary when attaching extra gallery images", () => {
    expect(
      resolveProductPrimaryImageId({
        createdIds: ["new-a"],
        primaryNewIndex: null,
        primaryExistingId: null,
        removeImageIds: [],
        remaining: [
          { id: "first", isPrimary: false },
          { id: "current", isPrimary: true },
        ],
      }),
    ).toBe("current");
  });

  it("falls back to the first remaining image after the primary is removed", () => {
    expect(
      resolveProductPrimaryImageId({
        createdIds: [],
        primaryNewIndex: null,
        primaryExistingId: "gone",
        removeImageIds: ["gone"],
        remaining: [{ id: "kept", isPrimary: false }],
      }),
    ).toBe("kept");
  });
});

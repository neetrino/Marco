import { describe, expect, it } from "vitest";

import { nextUniqueProductSlug } from "@/features/products/domain/unique-product-slug";

describe("nextUniqueProductSlug", () => {
  it("keeps the slugified name when it is free", () => {
    expect(nextUniqueProductSlug("White Tee", new Set())).toBe("white-tee");
  });

  it("appends 1, then 2, then 3 when the same name is already taken", () => {
    expect(nextUniqueProductSlug("White Tee", new Set(["white-tee"]))).toBe(
      "white-tee-1",
    );
    expect(
      nextUniqueProductSlug("White Tee", new Set(["white-tee", "white-tee-1"])),
    ).toBe("white-tee-2");
    expect(
      nextUniqueProductSlug(
        "White Tee",
        new Set(["white-tee", "white-tee-1", "white-tee-2"]),
      ),
    ).toBe("white-tee-3");
  });

  it("does not skip a free numeric suffix", () => {
    expect(
      nextUniqueProductSlug(
        "White Tee",
        new Set(["white-tee", "white-tee-2"]),
      ),
    ).toBe("white-tee-1");
  });
});

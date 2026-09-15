import { describe, expect, it } from "vitest";

import {
  hasHeaderCategoryPromo,
  headerCategoryPromoHeadline,
  headerCategoryPromoImageUrl,
  resolveHeaderCategoryPromo,
} from "@/features/categories/domain/header-category-promo";

describe("resolveHeaderCategoryPromo", () => {
  it("maps furniture slugs", () => {
    expect(resolveHeaderCategoryPromo("kahovyq")).toBe("furniture");
    expect(resolveHeaderCategoryPromo("կահույք")).toBe("furniture");
  });

  it("maps furniture by localized title when the slug is unrelated", () => {
    expect(resolveHeaderCategoryPromo("ցսցսդցսդցսդց", "Կահույք")).toBe(
      "furniture",
    );
  });

  it("maps hardware slugs that share a furniture prefix", () => {
    expect(
      resolveHeaderCategoryPromo("kahovyqi-patrastman-paraganer-3"),
    ).toBe("hardware");
    expect(
      resolveHeaderCategoryPromo("կահույքի-պատրաստման-պարագաներ"),
    ).toBe("hardware");
    expect(
      resolveHeaderCategoryPromo("կահույքի-պատրաստման-համար-պարականեր"),
    ).toBe("hardware");
  });

  it("maps hardware by title before a furniture title substring", () => {
    expect(
      resolveHeaderCategoryPromo(
        "random-slug",
        "Կահույքի պատրաստման համար պարականեր",
      ),
    ).toBe("hardware");
  });

  it("uses generic copy for every other root category", () => {
    expect(resolveHeaderCategoryPromo("unknown-root")).toBe("generic");
    expect(
      resolveHeaderCategoryPromo(
        "tekhnika-ev-elektronika",
        "Տեխնիկա և Էլեկտրոնիկա",
      ),
    ).toBe("generic");
  });
});

describe("headerCategoryPromoHeadline", () => {
  it("returns only a trimmed admin drawer title", () => {
    expect(headerCategoryPromoHeadline("Custom promo")).toBe("Custom promo");
    expect(headerCategoryPromoHeadline("   ")).toBeNull();
    expect(headerCategoryPromoHeadline(null)).toBeNull();
  });
});

describe("headerCategoryPromoImageUrl", () => {
  it("returns only an admin-uploaded banner", () => {
    expect(
      headerCategoryPromoImageUrl("https://cdn.example/banner.webp"),
    ).toBe("https://cdn.example/banner.webp");
    expect(headerCategoryPromoImageUrl("   ")).toBeNull();
    expect(headerCategoryPromoImageUrl(null)).toBeNull();
  });
});

describe("hasHeaderCategoryPromo", () => {
  it("is true when admin set a title or banner", () => {
    expect(hasHeaderCategoryPromo("Promo", null)).toBe(true);
    expect(hasHeaderCategoryPromo(null, "https://cdn.example/b.webp")).toBe(
      true,
    );
    expect(hasHeaderCategoryPromo("  ", null)).toBe(false);
  });
});

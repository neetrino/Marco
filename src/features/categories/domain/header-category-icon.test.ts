import { describe, expect, it } from "vitest";

import {
  isSvgImageSrc,
  resolveAdminCategoryIconUrl,
  resolveHeaderCategoryIconKey,
  resolveHeaderCategoryIconUrl,
} from "@/features/categories/domain/header-category-icon";

describe("resolveHeaderCategoryIconKey", () => {
  it("maps mega-menu roots", () => {
    expect(resolveHeaderCategoryIconKey("kahovyq", "Կահույք")).toBe("furniture");
    expect(
      resolveHeaderCategoryIconKey(
        "kahovyqi-patrastman-paraganer",
        "Կահույքի պատրաստման պարագաներ",
      ),
    ).toBe("furniture-hardware");
    expect(
      resolveHeaderCategoryIconKey(
        "texnika-ev-elektronika",
        "Տեխնիկա և էլեկտրոնիկա",
      ),
    ).toBe("electronics");
  });

  it("maps electronics subcategory groups", () => {
    expect(
      resolveHeaderCategoryIconKey("audio-ev-video", "Աուդիո և վիդեո համակարգեր"),
    ).toBe("audio-video");
    expect(
      resolveHeaderCategoryIconKey("xohanocayin-texnika", "Խոհանոցային տեխնիկա"),
    ).toBe("kitchen-appliances");
    expect(
      resolveHeaderCategoryIconKey(
        "khoshor-kencaxayin-texnika",
        "Խոշոր կենցաղային տեխնիկա",
      ),
    ).toBe("large-appliances");
    expect(
      resolveHeaderCategoryIconKey("kencaxayin-texnika", "Կենցաղային տեխնիկա"),
    ).toBe("home-appliances");
    expect(
      resolveHeaderCategoryIconKey("jri-dispensernerr", "Ջրի դիսպենսերներ"),
    ).toBe("water-dispenser");
    expect(
      resolveHeaderCategoryIconKey(
        "odorakichner-ev-taqacucichner",
        "Օդորակիչներ և տաքացուցիչներ",
      ),
    ).toBe("climate");
  });

  it("does not pin furniture children to the root wardrobe icon", () => {
    expect(
      resolveHeaderCategoryIconKey("papuk-kahovyq", "Փափուկ կահույք"),
    ).toBeNull();
  });
});

describe("resolveHeaderCategoryIconUrl", () => {
  it("prefers uploaded images", () => {
    expect(
      resolveHeaderCategoryIconUrl(
        "kahovyq",
        "Կահույք",
        "https://cdn.example/custom.webp",
      ),
    ).toBe("https://cdn.example/custom.webp");
  });

  it("falls back to catalog keyword icons for furniture children", () => {
    expect(
      resolveHeaderCategoryIconUrl("papuk-kahovyq", "Փափուկ կահույք", null),
    ).toBe("/assets/mobile-catalog/icons/sofa.svg");
  });
});

describe("resolveAdminCategoryIconUrl", () => {
  it("shows the storefront furniture icon when no upload exists", () => {
    expect(resolveAdminCategoryIconUrl("kahovyq", "Կահույք", null)).toBe(
      "/assets/header-category/icons/furniture.svg",
    );
  });

  it("is empty until the admin row has a name or upload", () => {
    expect(resolveAdminCategoryIconUrl("", "", null)).toBeNull();
    expect(
      resolveAdminCategoryIconUrl("", "", "https://cdn.example/icon.webp"),
    ).toBe("https://cdn.example/icon.webp");
  });
});

describe("isSvgImageSrc", () => {
  it("detects svg paths with optional query strings", () => {
    expect(isSvgImageSrc("/assets/header-category/icons/furniture.svg")).toBe(
      true,
    );
    expect(isSvgImageSrc("https://cdn.example/icon.svg?v=1")).toBe(true);
    expect(isSvgImageSrc("https://cdn.example/icon.webp")).toBe(false);
  });
});


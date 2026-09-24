import { describe, expect, it } from "vitest";

import { buildMobileDrawerNavItems } from "@/components/layout/mobile-nav-drawer-items";
import { getDictionary } from "@/lib/i18n/get-dictionary";

describe("buildMobileDrawerNavItems", () => {
  it("opens categories in place of compare and keeps the other drawer links", () => {
    const items = buildMobileDrawerNavItems("hy", getDictionary("hy"));

    expect(
      items.map((item) => (item.kind === "link" ? item.href : item.kind)),
    ).toEqual([
      "catalog",
      "/hy/brand",
      "/hy/about",
      "/hy/contact",
      "/hy/reels",
    ]);
    expect(items[0]?.label).toBe("Կատեգորիաներ");
  });
});

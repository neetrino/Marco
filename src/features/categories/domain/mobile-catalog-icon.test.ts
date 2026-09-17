import { describe, expect, it } from "vitest";

import {
  resolveMobileCatalogIconKey,
  resolveMobileCatalogRowIconUrl,
} from "@/features/categories/domain/mobile-catalog-icon";

describe("resolveMobileCatalogIconKey", () => {
  it("maps furniture and board categories", () => {
    expect(resolveMobileCatalogIconKey("papuk-kahovyq", "Փափուկ կահույք")).toBe(
      "sofa",
    );
    expect(resolveMobileCatalogIconKey("nnjasenaki-kahovyq", "Ննջասենյակի կահույք")).toBe(
      "bed",
    );
    expect(
      resolveMobileCatalogIconKey("laminacvac-saler", "Լամինացված սալեր"),
    ).toBe("board");
    expect(resolveMobileCatalogIconKey("aksesuar", "Աքսեսուար")).toBe(
      "accessory",
    );
    expect(resolveMobileCatalogIconKey("spung", "Սպունգ")).toBe("sponge");
  });

  it("maps electronics categories", () => {
    expect(resolveMobileCatalogIconKey("herustacuycner", "Հեռուստացույցներ")).toBe(
      "tv",
    );
    expect(
      resolveMobileCatalogIconKey("audio-ev-video", "Աուդիո և վիդեո համակարգեր"),
    ).toBe("audio");
    expect(
      resolveMobileCatalogIconKey("xohanocayin-texnika", "Խոհանոցային տեխնիկա"),
    ).toBe("kitchen");
  });
});

describe("resolveMobileCatalogRowIconUrl", () => {
  it("prefers uploaded images over static icons", () => {
    expect(
      resolveMobileCatalogRowIconUrl(
        "papuk",
        "Փափուկ",
        "https://cdn.example/custom.webp",
      ),
    ).toBe("https://cdn.example/custom.webp");
    expect(resolveMobileCatalogRowIconUrl("papuk", "Փափուկ", null)).toBe(
      "/assets/mobile-catalog/icons/sofa.svg",
    );
  });
});

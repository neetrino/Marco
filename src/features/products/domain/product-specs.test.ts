import { describe, expect, it } from "vitest";

import {
  parseProductSpecs,
  slugifyProductTitle,
} from "@/features/products/domain/product-specs";

describe("product specs", () => {
  it("parses title/value rows and drops empty ones", () => {
    expect(
      parseProductSpecs([
        { id: "a", title: "  Չափս  ", value: " M " },
        { title: "   ", value: "" },
        { id: "b", title: "Գործվածք", value: "Բամբակ" },
      ]),
    ).toEqual([
      { id: "a", title: "Չափս", value: "M" },
      { id: "b", title: "Գործվածք", value: "Բամբակ" },
    ]);
  });

  it("slugifies product titles", () => {
    expect(slugifyProductTitle("  White Tee!  ")).toBe("white-tee");
  });

  it("transliterates Armenian titles into Latin slugs", () => {
    expect(slugifyProductTitle("Ճարպաջեռոց Hausberg HB-2343AB")).toBe(
      "charpajerots-hausberg-hb-2343ab",
    );
    expect(slugifyProductTitle("ճարպաջեռոց-hausberg-hb-2343ab")).toBe(
      "charpajerots-hausberg-hb-2343ab",
    );
    expect(slugifyProductTitle("Ոսկե գդալ")).toBe("oske-gdal");
    expect(slugifyProductTitle("և")).toBe("yev");
    expect(slugifyProductTitle("киреи")).toBe("kirei");
    expect(slugifyProductTitle("Мона 1")).toBe("mona-1");
  });
});

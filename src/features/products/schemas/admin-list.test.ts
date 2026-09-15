import { describe, expect, it } from "vitest";

import {
  adminProductsFilterSchema,
  productIdsSchema,
} from "@/features/products/schemas/admin-list";

describe("adminProductsFilterSchema", () => {
  it("defaults stock, published, sort, and page", () => {
    expect(adminProductsFilterSchema.parse({})).toEqual({
      stock: "all",
      published: "all",
      sort: "created",
      dir: "desc",
      page: 1,
    });
  });

  it("accepts a published status filter", () => {
    expect(
      adminProductsFilterSchema.parse({ published: "unpublished", q: "sku-1" }),
    ).toMatchObject({ published: "unpublished", q: "sku-1" });
  });

  it("accepts UUID and imported CUID category ids", () => {
    const uuid = "0193e0a0-7c3b-7b6e-9c1a-2f4d5e6a7b8c";
    const cuid = "clxyz0123456789abcdefgh";
    expect(
      adminProductsFilterSchema.parse({ categoryId: uuid }),
    ).toMatchObject({ categoryId: uuid });
    expect(
      adminProductsFilterSchema.parse({ categoryId: cuid }),
    ).toMatchObject({ categoryId: cuid });
  });

  it("rejects empty category ids", () => {
    expect(adminProductsFilterSchema.safeParse({ categoryId: "  " }).success).toBe(
      false,
    );
  });
});

describe("productIdsSchema", () => {
  it("accepts catalog text product ids", () => {
    expect(
      productIdsSchema.parse({
        productIds: ["clxyz0123456789abcdefgh", "0193e0a0-7c3b-7b6e-9c1a-2f4d5e6a7b8c"],
      }),
    ).toEqual({
      productIds: [
        "clxyz0123456789abcdefgh",
        "0193e0a0-7c3b-7b6e-9c1a-2f4d5e6a7b8c",
      ],
    });
  });
});

import { describe, expect, it } from "vitest";

import { categoryIdSchema } from "@/features/categories/domain/category-id";

describe("categoryIdSchema", () => {
  it("accepts imported CUID parent ids and admin UUIDv7 ids", () => {
    expect(categoryIdSchema.parse("cmppdb2mh00g2rskbhrgd3o1d")).toBe(
      "cmppdb2mh00g2rskbhrgd3o1d",
    );
    expect(
      categoryIdSchema.parse("01900000-0000-7000-8000-000000000001"),
    ).toBe("01900000-0000-7000-8000-000000000001");
  });

  it("rejects an empty id", () => {
    expect(categoryIdSchema.safeParse("").success).toBe(false);
    expect(categoryIdSchema.safeParse("   ").success).toBe(false);
  });
});

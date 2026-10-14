import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { latestPaymentMethodSql } from "@/features/orders/application/latest-payment-method-sql";

function sqlText(query: ReturnType<typeof sql>): string {
  return query.queryChunks
    .map((chunk) => {
      if (
        typeof chunk === "object" &&
        chunk !== null &&
        "value" in chunk &&
        Array.isArray(chunk.value)
      ) {
        return chunk.value.join("");
      }
      return "";
    })
    .join(" ");
}

describe("latestPaymentMethodSql", () => {
  it("keeps the outer orders.id reference inside the subquery", () => {
    expect(sqlText(latestPaymentMethodSql())).toContain("= orders.id");
  });
});

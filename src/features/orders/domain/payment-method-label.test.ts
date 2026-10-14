import { describe, expect, it } from "vitest";

import { paymentMethodLabel } from "@/features/orders/domain/payment-method-label";

describe("paymentMethodLabel", () => {
  it("maps stored provider methods to Arca, Idram, and Cash", () => {
    expect(paymentMethodLabel("ARCA")).toBe("Arca");
    expect(paymentMethodLabel("IDRAM")).toBe("Idram");
    expect(paymentMethodLabel("COD")).toBe("Cash");
    expect(paymentMethodLabel("cash_on_delivery")).toBe("Cash");
  });

  it("returns an em dash when the order has no payment", () => {
    expect(paymentMethodLabel(null)).toBe("—");
    expect(paymentMethodLabel("  ")).toBe("—");
  });
});

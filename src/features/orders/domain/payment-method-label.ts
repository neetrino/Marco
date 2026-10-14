/** Display label for a stored payments.method value. */
export function paymentMethodLabel(method: string | null | undefined): string {
  const normalized = method?.trim().toUpperCase() ?? "";
  if (normalized === "ARCA") return "Arca";
  if (normalized === "IDRAM") return "Idram";
  if (
    normalized === "COD" ||
    normalized === "CASH" ||
    normalized === "CASH_ON_DELIVERY"
  ) {
    return "Cash";
  }
  return method?.trim() || "—";
}

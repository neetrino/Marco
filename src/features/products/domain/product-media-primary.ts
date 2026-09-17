type RemainingProductImage = {
  id: string;
  isPrimary: boolean;
};

/** Picks the next primary image after gallery uploads/removals. */
export function resolveProductPrimaryImageId(input: {
  createdIds: string[];
  primaryNewIndex: number | null;
  primaryExistingId: string | null;
  removeImageIds: readonly string[];
  remaining: readonly RemainingProductImage[];
}): string | null {
  if (
    input.primaryNewIndex != null &&
    input.primaryNewIndex >= 0 &&
    input.primaryNewIndex < input.createdIds.length
  ) {
    return input.createdIds[input.primaryNewIndex] ?? null;
  }

  if (
    input.primaryExistingId &&
    !input.removeImageIds.includes(input.primaryExistingId)
  ) {
    return input.primaryExistingId;
  }

  const currentPrimary = input.remaining.find((row) => row.isPrimary);
  return currentPrimary?.id ?? input.remaining[0]?.id ?? input.createdIds[0] ?? null;
}

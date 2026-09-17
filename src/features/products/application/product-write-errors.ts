const SKU_TAKEN = "A product with this SKU already exists.";
const SLUG_TAKEN = "A product with this slug already exists.";
const SAVE_FAILED = "Unable to save product.";

/** True for Next.js redirect() / notFound() control-flow errors. */
export function isNavigationControlError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return false;
  }
  const digest = (error as { digest: unknown }).digest;
  return (
    typeof digest === "string" &&
    (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND"))
  );
}

function collectErrorText(error: unknown): string {
  const parts: string[] = [];
  const queue: unknown[] = [error];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (current == null || visited.has(current)) continue;
    if (typeof current === "object") visited.add(current);

    if (current instanceof Error) {
      parts.push(current.message);
      if (current.cause) queue.push(current.cause);
      continue;
    }

    if (typeof current !== "object") {
      parts.push(String(current));
      continue;
    }

    const value = current as {
      code?: unknown;
      constraint?: unknown;
      detail?: unknown;
      message?: unknown;
      cause?: unknown;
    };
    if (typeof value.code === "string") parts.push(value.code);
    if (typeof value.constraint === "string") parts.push(value.constraint);
    if (typeof value.detail === "string") parts.push(value.detail);
    if (typeof value.message === "string") parts.push(value.message);
    if (value.cause) queue.push(value.cause);
  }

  return parts.join(" ");
}

/** Maps product write failures to a user-safe message. */
export function productWriteErrorMessage(error: unknown): string {
  const text = collectErrorText(error);
  if (text.includes("products_sku_uidx")) return SKU_TAKEN;
  if (text.includes("products_slug_")) return SLUG_TAKEN;
  return SAVE_FAILED;
}

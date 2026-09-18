import type { Locale } from "@/lib/i18n/config";

/** Max products shown in the header search typeahead. */
export const CATALOG_SEARCH_SUGGESTION_LIMIT = 8;

/** Wait after the last keystroke before fetching suggestions. */
export const HEADER_SEARCH_SUGGESTION_DEBOUNCE_MS = 250;

export type CatalogSearchSuggestion = {
  id: string;
  href: string;
  title: string;
  imageUrl: string | null;
  priceFormatted: string | null;
};

type SuggestionProduct = {
  id: string;
  priceAmount: number;
  imageUrl: string | null;
  translation: {
    title: string;
    slug: string;
  };
};

/** Maps a catalog product to the compact header typeahead row. */
export function mapCatalogSearchSuggestion(
  product: SuggestionProduct,
  locale: Locale,
  priceFormatted: string | null,
): CatalogSearchSuggestion {
  return {
    id: product.id,
    href: `/${locale}/products/${product.translation.slug}`,
    title: product.translation.title,
    imageUrl: product.imageUrl,
    priceFormatted: product.priceAmount > 0 ? priceFormatted : null,
  };
}

/** Cycles the highlighted suggestion; `-1` means the text field itself. */
export function nextSuggestionIndex(
  current: number,
  itemCount: number,
  direction: 1 | -1,
): number {
  if (itemCount === 0) return -1;
  if (current < 0) return direction === 1 ? 0 : itemCount - 1;
  return (current + direction + itemCount) % itemCount;
}

export type HeaderSearchKeyAction =
  | { type: "none" }
  | { type: "highlight"; index: number }
  | { type: "close" }
  | { type: "navigate"; href: string };

/** Maps typeahead keypresses to a UI action without touching the DOM. */
export function resolveHeaderSearchKeyAction(input: {
  key: string;
  open: boolean;
  activeIndex: number;
  itemCount: number;
  activeHref: string | undefined;
}): HeaderSearchKeyAction {
  if (!input.open) return { type: "none" };
  if (input.key === "ArrowDown") {
    return {
      type: "highlight",
      index: nextSuggestionIndex(input.activeIndex, input.itemCount, 1),
    };
  }
  if (input.key === "ArrowUp") {
    return {
      type: "highlight",
      index: nextSuggestionIndex(input.activeIndex, input.itemCount, -1),
    };
  }
  if (input.key === "Escape") return { type: "close" };
  if (input.key === "Enter" && input.activeHref) {
    return { type: "navigate", href: input.activeHref };
  }
  return { type: "none" };
}

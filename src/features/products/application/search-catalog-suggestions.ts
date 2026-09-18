import "server-only";

import {
  mapCatalogSearchSuggestion,
  type CatalogSearchSuggestion,
} from "@/features/products/domain/catalog-search-suggestions";
import { searchCatalogProductSuggestions } from "@/features/products/queries";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";
import { createDisplayPriceFormatter } from "@/lib/money/display-price";

/** Loads priced typeahead rows for the header search drawer. */
export async function searchCatalogSuggestions(
  locale: Locale,
  currency: Currency,
  query: string,
): Promise<CatalogSearchSuggestion[]> {
  const [products, formatPrice] = await Promise.all([
    searchCatalogProductSuggestions(locale, query),
    createDisplayPriceFormatter(locale, currency),
  ]);

  return products.map((product) =>
    mapCatalogSearchSuggestion(
      product,
      locale,
      product.priceAmount > 0 ? formatPrice(product.priceAmount).formatted : null,
    ),
  );
}

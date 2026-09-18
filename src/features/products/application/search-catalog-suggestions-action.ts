"use server";

import { searchCatalogSuggestions } from "@/features/products/application/search-catalog-suggestions";
import type { CatalogSearchSuggestion } from "@/features/products/domain/catalog-search-suggestions";
import { normalizeCatalogSearchQuery } from "@/features/products/domain/catalog-text-search";
import { isLocale } from "@/lib/i18n/config";
import { isCurrency } from "@/lib/money/currency";
import { logger } from "@/lib/observability/logger";

/** Client entry for header search typeahead; never throws to the input. */
export async function searchCatalogSuggestionsAction(
  locale: string,
  currency: string,
  rawQuery: string,
): Promise<CatalogSearchSuggestion[]> {
  if (!isLocale(locale) || !isCurrency(currency)) return [];
  const query = normalizeCatalogSearchQuery(rawQuery);
  if (!query) return [];

  try {
    return await searchCatalogSuggestions(locale, currency, query);
  } catch (error) {
    logger.error("catalog.search_suggestions_failed", {
      locale,
      reason: error instanceof Error ? error.message : "unknown",
    });
    return [];
  }
}

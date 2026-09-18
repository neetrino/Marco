"use client";

import { useEffect, useRef, useState } from "react";

import { searchCatalogSuggestionsAction } from "@/features/products/application/search-catalog-suggestions-action";
import {
  HEADER_SEARCH_SUGGESTION_DEBOUNCE_MS,
  type CatalogSearchSuggestion,
} from "@/features/products/domain/catalog-search-suggestions";
import { normalizeCatalogSearchQuery } from "@/features/products/domain/catalog-text-search";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type UseHeaderSearchSuggestionsInput = {
  locale: Locale;
  currency: Currency;
  urlQuery: string;
  enabled: boolean;
};

export function useHeaderSearchSuggestions({
  locale,
  currency,
  urlQuery,
  enabled,
}: UseHeaderSearchSuggestionsInput) {
  const [query, setQueryState] = useState(urlQuery);
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  const [items, setItems] = useState<CatalogSearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery);
    setQueryState(urlQuery);
  }

  function setQuery(value: string): void {
    setQueryState(value);
    if (normalizeCatalogSearchQuery(value)) return;
    requestIdRef.current += 1;
    setItems([]);
    setLoading(false);
  }

  useEffect(() => {
    const normalized = normalizeCatalogSearchQuery(query);
    if (!enabled || !normalized) {
      requestIdRef.current += 1;
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const timer = window.setTimeout(() => {
      setLoading(true);
      void searchCatalogSuggestionsAction(locale, currency, normalized).then(
        (results) => {
          if (requestIdRef.current !== requestId) return;
          setItems(results);
          setLoading(false);
        },
      );
    }, HEADER_SEARCH_SUGGESTION_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query, enabled, locale, currency]);

  return { query, setQuery, items, loading };
}

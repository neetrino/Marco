"use client";

import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useRef, useState, type KeyboardEvent } from "react";

import { catalogHref } from "@/features/products/domain/catalog-href";
import { EMPTY_CATALOG_SEARCH } from "@/features/products/domain/catalog-search-params";
import { resolveHeaderSearchKeyAction } from "@/features/products/domain/catalog-search-suggestions";
import {
  CATALOG_SEARCH_QUERY_MAX_LENGTH,
  normalizeCatalogSearchQuery,
} from "@/features/products/domain/catalog-text-search";
import { HeaderSearchSuggestionsPanel } from "@/features/products/ui/HeaderSearchSuggestionsPanel";
import {
  HEADER_SEARCH_CLEAR_CLASS,
  HEADER_SEARCH_INPUT_CLASS,
} from "@/features/products/ui/header-search-suggestions.classes";
import { useHeaderSearchSuggestions } from "@/features/products/ui/use-header-search-suggestions";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

export type HeaderSearchFieldCopy = {
  placeholder: string;
  suggestionsLabel: string;
  seeAllResults: string;
  noResults: string;
  clearLabel: string;
};

type HeaderSearchFieldProps = {
  locale: Locale;
  currency: Currency;
  copy: HeaderSearchFieldCopy;
};

export function HeaderSearchField({
  locale,
  currency,
  copy,
}: HeaderSearchFieldProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listId = useId();
  const blurTimerRef = useRef<number | null>(null);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { query, setQuery, items, loading } = useHeaderSearchSuggestions({
    locale,
    currency,
    urlQuery: searchParams.get("q") ?? "",
    enabled: focused,
  });
  const normalized = normalizeCatalogSearchQuery(query);
  const open = focused && normalized != null;

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    const action = resolveHeaderSearchKeyAction({
      key: event.key,
      open,
      activeIndex,
      itemCount: items.length,
      activeHref: items[activeIndex]?.href,
    });
    if (action.type === "none") return;
    event.preventDefault();
    if (action.type === "highlight") setActiveIndex(action.index);
    if (action.type === "close") {
      setFocused(false);
      event.currentTarget.blur();
    }
    if (action.type === "navigate") router.push(action.href);
  }

  return (
    <>
      <HeaderSearchInput
        listId={listId}
        query={query}
        open={open}
        activeIndex={activeIndex}
        copy={copy}
        onQueryChange={(value) => {
          if (blurTimerRef.current != null) {
            window.clearTimeout(blurTimerRef.current);
            blurTimerRef.current = null;
          }
          setFocused(true);
          setQuery(value);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          if (blurTimerRef.current != null) {
            window.clearTimeout(blurTimerRef.current);
            blurTimerRef.current = null;
          }
          setFocused(true);
        }}
        onBlur={() => {
          blurTimerRef.current = window.setTimeout(() => {
            setFocused(false);
          }, 180);
        }}
        onKeyDown={handleKeyDown}
        onClear={() => {
          setQuery("");
          setActiveIndex(-1);
        }}
      />
      {open ? (
        <HeaderSearchSuggestionsPanel
          listId={listId}
          items={items}
          loading={loading}
          activeIndex={activeIndex}
          seeAllHref={catalogHref(locale, {
            ...EMPTY_CATALOG_SEARCH,
            q: normalized,
          })}
          seeAllLabel={copy.seeAllResults}
          noResultsLabel={copy.noResults}
          suggestionsLabel={copy.suggestionsLabel}
          onActiveIndexChange={setActiveIndex}
        />
      ) : null}
    </>
  );
}

type HeaderSearchInputProps = {
  listId: string;
  query: string;
  open: boolean;
  activeIndex: number;
  copy: HeaderSearchFieldCopy;
  onQueryChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onClear: () => void;
};

function HeaderSearchInput({
  listId,
  query,
  open,
  activeIndex,
  copy,
  onQueryChange,
  onFocus,
  onBlur,
  onKeyDown,
  onClear,
}: HeaderSearchInputProps) {
  return (
    <>
      <input
        type="search"
        name="q"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onFocus={onFocus}
        onClick={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={copy.placeholder}
        className={HEADER_SEARCH_INPUT_CLASS}
        aria-label={copy.placeholder}
        aria-autocomplete="list"
        aria-controls={open ? listId : undefined}
        aria-expanded={open}
        aria-activedescendant={
          open && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
        }
        role="combobox"
        autoComplete="off"
        maxLength={CATALOG_SEARCH_QUERY_MAX_LENGTH}
      />
      {query.length > 0 ? (
        <button
          type="button"
          className={HEADER_SEARCH_CLEAR_CLASS}
          aria-label={copy.clearLabel}
          onClick={onClear}
        >
          <X className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </>
  );
}

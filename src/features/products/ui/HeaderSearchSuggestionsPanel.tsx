"use client";

import Image from "next/image";

import { AppLink } from "@/components/ui/AppLink";
import type { CatalogSearchSuggestion } from "@/features/products/domain/catalog-search-suggestions";
import {
  HEADER_SEARCH_EMPTY_CLASS,
  HEADER_SEARCH_FOOTER_CLASS,
  HEADER_SEARCH_LIST_CLASS,
  HEADER_SEARCH_PANEL_CLASS,
  HEADER_SEARCH_PRICE_CLASS,
  HEADER_SEARCH_ROW_ACTIVE_CLASS,
  HEADER_SEARCH_ROW_CLASS,
  HEADER_SEARCH_SKELETON_CLASS,
  HEADER_SEARCH_THUMB_CLASS,
  HEADER_SEARCH_TITLE_CLASS,
} from "@/features/products/ui/header-search-suggestions.classes";

type HeaderSearchSuggestionsPanelProps = {
  listId: string;
  items: readonly CatalogSearchSuggestion[];
  loading: boolean;
  activeIndex: number;
  seeAllHref: string;
  seeAllLabel: string;
  noResultsLabel: string;
  suggestionsLabel: string;
  onActiveIndexChange: (index: number) => void;
};

export function HeaderSearchSuggestionsPanel({
  listId,
  items,
  loading,
  activeIndex,
  seeAllHref,
  seeAllLabel,
  noResultsLabel,
  suggestionsLabel,
  onActiveIndexChange,
}: HeaderSearchSuggestionsPanelProps) {
  return (
    <div id={listId} className={HEADER_SEARCH_PANEL_CLASS}>
      <SuggestionList
        listId={listId}
        items={items}
        loading={loading}
        activeIndex={activeIndex}
        noResultsLabel={noResultsLabel}
        suggestionsLabel={suggestionsLabel}
        onActiveIndexChange={onActiveIndexChange}
      />
      <AppLink
        href={seeAllHref}
        prefetchPolicy="intent"
        className={HEADER_SEARCH_FOOTER_CLASS}
      >
        {seeAllLabel}
      </AppLink>
    </div>
  );
}

function SuggestionList({
  listId,
  items,
  loading,
  activeIndex,
  noResultsLabel,
  suggestionsLabel,
  onActiveIndexChange,
}: Omit<HeaderSearchSuggestionsPanelProps, "seeAllHref" | "seeAllLabel">) {
  if (loading && items.length === 0) {
    return (
      <div aria-hidden>
        <div className={HEADER_SEARCH_SKELETON_CLASS} />
        <div className={HEADER_SEARCH_SKELETON_CLASS} />
        <div className={HEADER_SEARCH_SKELETON_CLASS} />
      </div>
    );
  }

  if (items.length === 0) {
    return <p className={HEADER_SEARCH_EMPTY_CLASS}>{noResultsLabel}</p>;
  }

  return (
    <ul
      role="listbox"
      aria-label={suggestionsLabel}
      className={HEADER_SEARCH_LIST_CLASS}
    >
      {items.map((item, index) => (
        <SuggestionRow
          key={item.id}
          id={`${listId}-option-${index}`}
          item={item}
          active={index === activeIndex}
          onFocus={() => onActiveIndexChange(index)}
        />
      ))}
    </ul>
  );
}

function SuggestionRow({
  id,
  item,
  active,
  onFocus,
}: {
  id: string;
  item: CatalogSearchSuggestion;
  active: boolean;
  onFocus: () => void;
}) {
  const rowClass = active
    ? `${HEADER_SEARCH_ROW_CLASS} ${HEADER_SEARCH_ROW_ACTIVE_CLASS}`
    : HEADER_SEARCH_ROW_CLASS;

  return (
    <li id={id} role="option" aria-selected={active}>
      <AppLink
        href={item.href}
        prefetchPolicy="intent"
        className={rowClass}
        onMouseEnter={onFocus}
        onFocus={onFocus}
      >
        <span className={HEADER_SEARCH_THUMB_CLASS}>
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt=""
              fill
              sizes="44px"
              className="object-cover object-center"
            />
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className={HEADER_SEARCH_TITLE_CLASS}>{item.title}</span>
          {item.priceFormatted ? (
            <span className={`mt-0.5 block ${HEADER_SEARCH_PRICE_CLASS}`}>
              {item.priceFormatted}
            </span>
          ) : null}
        </span>
      </AppLink>
    </li>
  );
}

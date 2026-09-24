"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { HeaderCategoryNode } from "@/features/categories/domain/header-category-menu";
import { resolveHeaderCategoryPromo } from "@/features/categories/domain/header-category-promo";
import { orderMobileCatalogSections } from "@/features/categories/domain/mobile-catalog-card";
import { MobileCatalogBrowseCards } from "@/features/categories/ui/MobileCatalogBrowseCards";
import { MobileCatalogBrowseSearch } from "@/features/categories/ui/MobileCatalogBrowseSearch";
import { MobileCatalogBrowseSection } from "@/features/categories/ui/MobileCatalogBrowseSection";
import {
  MOBILE_BROWSE_CLOSE_BTN_CLASS,
  MOBILE_BROWSE_CLOSE_WRAP_CLASS,
  MOBILE_BROWSE_OVERLAY_CLASS,
  MOBILE_BROWSE_SCROLL_CLASS,
  MOBILE_BROWSE_SECTIONS_CLASS,
} from "@/features/categories/ui/mobile-catalog-browse.classes";
import { catalogHref } from "@/features/products/domain/catalog-href";
import { EMPTY_CATALOG_SEARCH } from "@/features/products/domain/catalog-search-params";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { useIsClient } from "@/lib/react/use-is-client";
import type { Locale } from "@/lib/i18n/config";

export type MobileCatalogBrowseCopy = {
  title: string;
  close: string;
  allCategories: string;
  expandCategory: string;
  collapseCategory: string;
  searchPlaceholder: string;
  searchSubmit: string;
};

export function mobileCatalogBrowseCopy(
  dictionary: Dictionary,
): MobileCatalogBrowseCopy {
  return {
    title: dictionary.catalog.mobileBrowseTitle,
    close: dictionary.catalog.closeBrowse,
    allCategories: dictionary.catalog.allCategories,
    expandCategory: dictionary.catalog.expandCategory,
    collapseCategory: dictionary.catalog.collapseCategory,
    searchPlaceholder: dictionary.catalog.mobileBrowseSearchPlaceholder,
    searchSubmit: dictionary.header.searchSubmit,
  };
}

type MobileCatalogBrowseDrawerProps = {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  categories: readonly HeaderCategoryNode[];
  copy: MobileCatalogBrowseCopy;
};

export function MobileCatalogBrowseDrawer({
  open,
  onClose,
  locale,
  categories,
  copy,
}: MobileCatalogBrowseDrawerProps) {
  const mounted = useIsClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const sectionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setSelectedId(null);
  }, [open]);

  const visibleSections = useMemo(
    () => orderMobileCatalogSections(categories, selectedId),
    [categories, selectedId],
  );

  useEffect(() => {
    if (!open || selectedId === null) return;
    const sections = sectionsRef.current;
    if (!sections) return;
    const scroller = sections.closest("[data-mobile-browse-scroll]");
    if (!(scroller instanceof HTMLElement)) return;
    const nextTop =
      scroller.scrollTop +
      (sections.getBoundingClientRect().top - scroller.getBoundingClientRect().top);
    scroller.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
  }, [open, selectedId]);

  function hrefFor(slug: string, root?: HeaderCategoryNode): string {
    const rootIsHardware =
      root != null &&
      resolveHeaderCategoryPromo(root.slug, root.title) === "hardware";
    return catalogHref(locale, {
      ...EMPTY_CATALOG_SEARCH,
      categorySlugs: [slug],
      ...(rootIsHardware ? { pricePresence: "without" as const } : {}),
    });
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
      className={MOBILE_BROWSE_OVERLAY_CLASS}
    >
      <div className={MOBILE_BROWSE_CLOSE_WRAP_CLASS}>
        <button
          type="button"
          onClick={onClose}
          className={MOBILE_BROWSE_CLOSE_BTN_CLASS}
          aria-label={copy.close}
        >
          <span className="relative size-[13px] overflow-hidden" aria-hidden>
            <Image
              src="/assets/mobile-catalog/icon-close.svg"
              alt=""
              width={13}
              height={13}
              className="size-full"
              unoptimized
            />
          </span>
        </button>
      </div>

      <div className={MOBILE_BROWSE_SCROLL_CLASS} data-mobile-browse-scroll>
        <MobileCatalogBrowseSearch
          locale={locale}
          placeholder={copy.searchPlaceholder}
          submitLabel={copy.searchSubmit}
          onSubmitNavigate={onClose}
        />

        <MobileCatalogBrowseCards
          categories={categories}
          selectedId={selectedId}
          allLabel={copy.allCategories}
          onSelectAll={() => setSelectedId(null)}
          onSelectCategory={setSelectedId}
        />

        {visibleSections.length > 0 ? (
          <div ref={sectionsRef} className={MOBILE_BROWSE_SECTIONS_CLASS}>
            {visibleSections.map((category) => (
              <MobileCatalogBrowseSection
                key={category.id}
                category={category}
                hrefFor={(slug) => hrefFor(slug, category)}
                expandLabel={copy.expandCategory}
                collapseLabel={copy.collapseCategory}
                onNavigate={onClose}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

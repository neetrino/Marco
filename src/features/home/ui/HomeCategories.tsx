"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { AppLink } from "@/components/ui/AppLink";
import type { HeaderCategoryNode } from "@/features/categories/domain/header-category-menu";
import { resolveHeaderCategoryPromo } from "@/features/categories/domain/header-category-promo";
import {
  mobileCatalogCardImageUrl,
  resolveMobileCatalogCardVisual,
  type MobileCatalogCardVisual,
} from "@/features/categories/domain/mobile-catalog-card";
import { HomeSectionHeading } from "@/features/home/ui/HomeSectionHeading";
import {
  HOME_PAGE_SHELL_CLASS,
  HOME_SCROLLER_CLASS,
} from "@/features/home/ui/home-section-classes";
import {
  HOME_CATEGORIES_AFTER_HERO_GAP_PX,
  HOME_CATEGORIES_CARD_GAP_PX,
  HOME_CATEGORIES_CARD_HEIGHT_PX,
  HOME_CATEGORIES_CARD_RADIUS_PX,
  HOME_CATEGORIES_CARD_WIDTH_PX,
  HOME_CATEGORIES_SCROLL_EDGE_PX,
  HOME_CATEGORIES_TITLE_TO_RAIL_GAP_PX,
} from "@/features/home/ui/home-section.constants";
import { catalogHref } from "@/features/products/domain/catalog-href";
import { EMPTY_CATALOG_SEARCH } from "@/features/products/domain/catalog-search-params";
import type { Locale } from "@/lib/i18n/config";

type HomeCategoriesProps = {
  locale: Locale;
  title: string;
  allLabel: string;
  previousPageLabel: string;
  nextPageLabel: string;
  categories: readonly HeaderCategoryNode[];
};

type CategoryRailItem = {
  key: string;
  title: string;
  href: string;
  imageUrl: string | null;
  emphasized: boolean;
  /** Used for Figma-specific image offsets on the compact home rail. */
  visual: MobileCatalogCardVisual;
};

function categoryHref(locale: Locale, category: HeaderCategoryNode): string {
  const isHardware =
    resolveHeaderCategoryPromo(category.slug, category.title) === "hardware";
  return catalogHref(locale, {
    ...EMPTY_CATALOG_SEARCH,
    categorySlugs: [category.slug],
    ...(isHardware ? { pricePresence: "without" as const } : {}),
  });
}

function buildRailItems(
  locale: Locale,
  allLabel: string,
  categories: readonly HeaderCategoryNode[],
): CategoryRailItem[] {
  const allHref = catalogHref(locale, EMPTY_CATALOG_SEARCH);
  const items: CategoryRailItem[] = [
    {
      key: "all",
      title: allLabel,
      href: allHref,
      imageUrl: mobileCatalogCardImageUrl("all"),
      emphasized: true,
      visual: "all",
    },
  ];

  for (const category of categories) {
    const visual = resolveMobileCatalogCardVisual(
      category.slug,
      category.title,
    );
    items.push({
      key: category.id,
      title: category.title,
      href: categoryHref(locale, category),
      imageUrl: mobileCatalogCardImageUrl(
        visual,
        category.bannerImageUrl ?? category.imageUrl,
      ),
      emphasized: false,
      visual,
    });
  }

  return items;
}

export function HomeCategories({
  locale,
  title,
  allLabel,
  previousPageLabel,
  nextPageLabel,
  categories,
}: HomeCategoriesProps) {
  const items = buildRailItems(locale, allLabel, categories);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollPrev(el.scrollLeft > HOME_CATEGORIES_SCROLL_EDGE_PX);
    setCanScrollNext(
      el.scrollLeft < maxScroll - HOME_CATEGORIES_SCROLL_EDGE_PX,
    );
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateScrollState, items.length]);

  const scrollByCard = useCallback((direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step =
      HOME_CATEGORIES_CARD_WIDTH_PX + HOME_CATEGORIES_CARD_GAP_PX;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  }, []);

  if (items.length === 0) return null;

  return (
    <section
      className="bg-white md:hidden"
      aria-labelledby="home-categories-heading"
      style={{ marginTop: HOME_CATEGORIES_AFTER_HERO_GAP_PX }}
    >
      <div className={HOME_PAGE_SHELL_CLASS}>
        <HomeSectionHeading
          id="home-categories-heading"
          title={title}
          prevLabel={previousPageLabel}
          nextLabel={nextPageLabel}
          onPrev={() => scrollByCard(-1)}
          onNext={() => scrollByCard(1)}
          canScrollPrev={canScrollPrev}
          canScrollNext={canScrollNext}
        />
        <div
          ref={scrollerRef}
          onScroll={updateScrollState}
          className={`${HOME_SCROLLER_CLASS} w-full`}
          style={{
            marginTop: HOME_CATEGORIES_TITLE_TO_RAIL_GAP_PX,
            gap: HOME_CATEGORIES_CARD_GAP_PX,
          }}
          aria-label={title}
        >
          {items.map((item) => (
            <HomeCategoryCard key={item.key} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeCategoryCard({ item }: { item: CategoryRailItem }) {
  return (
    <AppLink
      href={item.href}
      prefetchPolicy="intent"
      className={`relative flex shrink-0 flex-col overflow-hidden text-left transition-[filter] hover:brightness-[0.98] active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-slate/25 ${
        item.emphasized ? "bg-marco-yellow" : "bg-[#e8e8e8]"
      }`}
      style={{
        width: HOME_CATEGORIES_CARD_WIDTH_PX,
        height: HOME_CATEGORIES_CARD_HEIGHT_PX,
        borderRadius: HOME_CATEGORIES_CARD_RADIUS_PX,
      }}
    >
      <span className="relative z-10 line-clamp-3 px-2.5 pt-3 text-sm font-medium leading-normal text-[#101010]">
        {item.title}
      </span>
      {item.imageUrl ? (
        <span
          className={
            item.visual === "furniture" || item.visual === "hardware"
              ? "pointer-events-none absolute inset-y-auto bottom-[-10%] left-[32%] right-[-14%] h-[78%]"
              : "pointer-events-none absolute inset-x-[-6%] bottom-[-10%] h-[78%]"
          }
          aria-hidden
        >
          <Image
            src={item.imageUrl}
            alt=""
            fill
            sizes={`${HOME_CATEGORIES_CARD_WIDTH_PX}px`}
            className="object-contain object-bottom"
            draggable={false}
          />
        </span>
      ) : null}
    </AppLink>
  );
}

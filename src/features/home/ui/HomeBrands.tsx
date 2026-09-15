"use client";

import Image from "next/image";

import { AppLink } from "@/components/ui/AppLink";
import type { StorefrontBrandListItem } from "@/features/brands/types";
import { chunkItems } from "@/features/home/paginate";
import { HomePaginationDots } from "@/features/home/ui/HomePaginationDots";
import { HomeSectionHeading } from "@/features/home/ui/HomeSectionHeading";
import { HomeSeeMoreCta } from "@/features/home/ui/HomeSeeMoreCta";
import {
  HOME_PAGE_SHELL_CLASS,
  HOME_SCROLLER_CLASS,
} from "@/features/home/ui/home-section-classes";
import {
  HOME_BRANDS_AFTER_PRODUCTS_GAP_PX,
  HOME_BRANDS_CARD_GAP_PX,
  HOME_BRANDS_CARD_MIN_HEIGHT_PX,
  HOME_BRANDS_CARD_RADIUS_PX,
  HOME_BRANDS_LOGO_HEIGHT_PX,
  HOME_BRANDS_PAGE_SIZE,
  HOME_BRANDS_TITLE_TO_RAIL_GAP_PX,
  HOME_DOTS_TO_CTA_GAP_PX,
  HOME_RAIL_TO_DOTS_GAP_PX,
} from "@/features/home/ui/home-section.constants";
import { useSnapCarousel } from "@/features/home/ui/use-snap-carousel";
import type { Locale } from "@/lib/i18n/config";

type HomeBrandsProps = {
  locale: Locale;
  title: string;
  viewAllLabel: string;
  viewAllHref: string;
  emptyLabel: string;
  paginationLabel: string;
  previousPageLabel: string;
  nextPageLabel: string;
  brands: readonly StorefrontBrandListItem[];
};

export function HomeBrands({
  locale,
  title,
  viewAllLabel,
  viewAllHref,
  emptyLabel,
  paginationLabel,
  previousPageLabel,
  nextPageLabel,
  brands,
}: HomeBrandsProps) {
  const pages = chunkItems(brands, HOME_BRANDS_PAGE_SIZE);
  const carousel = useSnapCarousel(Math.max(pages.length, 1));

  if (brands.length === 0) {
    return (
      <section className="bg-white py-8" aria-labelledby="home-brands-heading">
        <div className={HOME_PAGE_SHELL_CLASS}>
          <h2 id="home-brands-heading" className="sr-only">{title}</h2>
          <p className="text-sm text-gray-600">{emptyLabel}</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="bg-white pb-10"
      aria-labelledby="home-brands-heading"
      style={{ marginTop: HOME_BRANDS_AFTER_PRODUCTS_GAP_PX }}
    >
      <div className={HOME_PAGE_SHELL_CLASS}>
        <HomeSectionHeading
          id="home-brands-heading"
          title={title}
          prevLabel={previousPageLabel}
          nextLabel={nextPageLabel}
          onPrev={() => carousel.scrollToPage(carousel.activePage - 1)}
          onNext={() => carousel.scrollToPage(carousel.activePage + 1)}
          canScrollPrev={carousel.canScrollPrev}
          canScrollNext={carousel.canScrollNext}
        />
        <div
          ref={carousel.scrollerRef}
          onScroll={carousel.onScroll}
          id="home-brands-rail"
          className={HOME_SCROLLER_CLASS}
          style={{
            marginTop: HOME_BRANDS_TITLE_TO_RAIL_GAP_PX,
            scrollSnapType: "x mandatory",
          }}
          aria-label={title}
        >
          {pages.map((page, pageIndex) => (
            <div
              key={`brands-page-${pageIndex}`}
              className="grid min-w-full shrink-0 snap-start grid-cols-2 md:grid-cols-4"
              style={{ gap: HOME_BRANDS_CARD_GAP_PX }}
            >
              {page.map((brand) => (
                <HomeBrandLogoCard
                  key={brand.id}
                  brand={brand}
                  locale={locale}
                  fallbackHref={viewAllHref}
                />
              ))}
            </div>
          ))}
        </div>
        <div style={{ marginTop: HOME_RAIL_TO_DOTS_GAP_PX }}>
          <HomePaginationDots
            pageCount={pages.length}
            activePage={carousel.activePage}
            label={paginationLabel}
            onGoToPage={carousel.scrollToPage}
          />
        </div>
        <div style={{ marginTop: HOME_DOTS_TO_CTA_GAP_PX }}>
          <HomeSeeMoreCta href={viewAllHref} label={viewAllLabel} />
        </div>
      </div>
    </section>
  );
}

function HomeBrandLogoCard({
  brand,
  locale,
  fallbackHref,
}: {
  brand: StorefrontBrandListItem;
  locale: Locale;
  fallbackHref: string;
}) {
  const href = brand.slug
    ? `/${locale}/products?brand=${encodeURIComponent(brand.slug)}`
    : fallbackHref;

  return (
    <AppLink
      href={href}
      prefetchPolicy="intent"
      className="flex w-full min-w-0 items-center justify-center overflow-hidden px-3 py-2 sm:px-4 sm:py-3"
      style={{
        minHeight: HOME_BRANDS_CARD_MIN_HEIGHT_PX,
        borderRadius: HOME_BRANDS_CARD_RADIUS_PX,
        backgroundColor: "#f6f6f6",
      }}
      aria-label={brand.title}
    >
      <div
        className="relative mx-auto w-full max-w-[264px]"
        style={{ height: HOME_BRANDS_LOGO_HEIGHT_PX }}
      >
        {brand.imageUrl ? (
          <Image
            src={brand.imageUrl}
            alt={brand.title}
            fill
            sizes="264px"
            className="object-contain"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-center text-xs font-semibold uppercase text-marco-slate sm:text-sm">
            {brand.title}
          </span>
        )}
      </div>
    </AppLink>
  );
}

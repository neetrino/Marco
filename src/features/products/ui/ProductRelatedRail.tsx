"use client";

import { chunkItems } from "@/features/home/paginate";
import { HomePaginationDots } from "@/features/home/ui/HomePaginationDots";
import { HomeRoundNavButtons } from "@/features/home/ui/HomeRoundNavButtons";
import {
  HOME_PRODUCT_CARD_GAP_PX,
  HOME_PRODUCT_DESKTOP_PAGE_SIZE,
  HOME_PRODUCT_MOBILE_PAGE_SIZE,
  HOME_RAIL_TO_DOTS_GAP_PX,
} from "@/features/home/ui/home-section.constants";
import { HOME_SCROLLER_CLASS } from "@/features/home/ui/home-section-classes";
import { useIsMaxMd } from "@/features/home/ui/use-is-max-md";
import { useSnapCarousel } from "@/features/home/ui/use-snap-carousel";
import {
  ProductCard,
  type ProductCardItem,
} from "@/features/products/ui/ProductCard";
import {
  PRODUCT_CARD_MOBILE_GRID_COLUMN_GAP_PX,
  PRODUCT_CARD_MOBILE_RAIL_PAGE_GAP_PX,
  PRODUCT_CARD_RAIL_MOBILE_PADDING_BOTTOM_PX,
} from "@/features/products/ui/product-card.constants";
import type { Locale } from "@/lib/i18n/config";

type ProductRelatedRailProps = {
  locale: Locale;
  title: string;
  previousPageLabel: string;
  nextPageLabel: string;
  paginationLabel: string;
  wishlistLabel: string;
  compareLabel: string;
  addToCartLabel: string;
  isSignedIn: boolean;
  products: readonly ProductCardItem[];
};

export function ProductRelatedRail({
  locale,
  title,
  previousPageLabel,
  nextPageLabel,
  paginationLabel,
  wishlistLabel,
  compareLabel,
  addToCartLabel,
  isSignedIn,
  products,
}: ProductRelatedRailProps) {
  const isMaxMd = useIsMaxMd();
  const mobilePages = chunkItems(products, HOME_PRODUCT_MOBILE_PAGE_SIZE);
  const desktopPages = chunkItems(products, HOME_PRODUCT_DESKTOP_PAGE_SIZE);
  const mobile = useSnapCarousel(Math.max(mobilePages.length, 1));
  const desktop = useSnapCarousel(Math.max(desktopPages.length, 1));
  const active = isMaxMd ? mobile : desktop;
  const showNav = products.length > HOME_PRODUCT_MOBILE_PAGE_SIZE;

  return (
    <section className="mt-16 border-t border-gray-200 pt-12 md:mt-20">
      <div className="mb-10 flex items-center justify-between gap-4">
        <h2 className="text-3xl font-bold text-marco-slate">{title}</h2>
        {showNav ? (
          <HomeRoundNavButtons
            prevLabel={previousPageLabel}
            nextLabel={nextPageLabel}
            onPrev={() => active.scrollToPage(active.activePage - 1)}
            onNext={() => active.scrollToPage(active.activePage + 1)}
            canScrollPrev={active.canScrollPrev}
            canScrollNext={active.canScrollNext}
          />
        ) : null}
      </div>
      <div className="md:hidden">
        <RelatedSnapPages
          scrollerRef={mobile.scrollerRef}
          onScroll={mobile.onScroll}
          pages={mobilePages}
          columns={HOME_PRODUCT_MOBILE_PAGE_SIZE}
          locale={locale}
          wishlistLabel={wishlistLabel}
          compareLabel={compareLabel}
          addToCartLabel={addToCartLabel}
          isSignedIn={isSignedIn}
        />
      </div>
      <div className="hidden md:block">
        <RelatedSnapPages
          scrollerRef={desktop.scrollerRef}
          onScroll={desktop.onScroll}
          pages={desktopPages}
          columns={HOME_PRODUCT_DESKTOP_PAGE_SIZE}
          locale={locale}
          wishlistLabel={wishlistLabel}
          compareLabel={compareLabel}
          addToCartLabel={addToCartLabel}
          isSignedIn={isSignedIn}
        />
      </div>
      <div style={{ marginTop: HOME_RAIL_TO_DOTS_GAP_PX }}>
        <div className="md:hidden">
          <HomePaginationDots
            pageCount={mobilePages.length}
            activePage={mobile.activePage}
            label={paginationLabel}
            onGoToPage={mobile.scrollToPage}
          />
        </div>
        <div className="hidden md:block">
          <HomePaginationDots
            pageCount={desktopPages.length}
            activePage={desktop.activePage}
            label={paginationLabel}
            onGoToPage={desktop.scrollToPage}
          />
        </div>
      </div>
    </section>
  );
}

function RelatedSnapPages({
  scrollerRef,
  onScroll,
  pages,
  columns,
  locale,
  wishlistLabel,
  compareLabel,
  addToCartLabel,
  isSignedIn,
}: {
  scrollerRef: ReturnType<typeof useSnapCarousel>["scrollerRef"];
  onScroll: () => void;
  pages: ProductCardItem[][];
  columns: number;
  locale: Locale;
  wishlistLabel: string;
  compareLabel: string;
  addToCartLabel: string;
  isSignedIn: boolean;
}) {
  const isMobileGrid = columns <= 2;
  const pageGapPx = isMobileGrid
    ? PRODUCT_CARD_MOBILE_RAIL_PAGE_GAP_PX
    : HOME_PRODUCT_CARD_GAP_PX;
  const columnGapPx = isMobileGrid
    ? PRODUCT_CARD_MOBILE_GRID_COLUMN_GAP_PX
    : HOME_PRODUCT_CARD_GAP_PX;

  return (
    <div
      ref={scrollerRef}
      onScroll={onScroll}
      className={HOME_SCROLLER_CLASS}
      style={{
        gap: pageGapPx,
        scrollSnapType: "x mandatory",
        paddingBottom: isMobileGrid
          ? PRODUCT_CARD_RAIL_MOBILE_PADDING_BOTTOM_PX
          : undefined,
      }}
    >
      {pages.map((page, pageIndex) => (
        <div
          key={`related-page-${pageIndex}`}
          className="grid min-h-0 w-full max-w-full shrink-0 grow-0 basis-full snap-start snap-always justify-items-stretch"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            columnGap: columnGapPx,
            rowGap: 0,
          }}
        >
          {page.map((product) => (
            <div key={product.id} className="flex min-h-0 w-full min-w-0">
              <ProductCard
                product={product}
                locale={locale}
                wishlistLabel={wishlistLabel}
                compareLabel={compareLabel}
                addToCartLabel={addToCartLabel}
                isSignedIn={isSignedIn}
                layout={isMobileGrid ? "mobileGrid" : "default"}
                maxWidthClassName={isMobileGrid ? "max-w-none" : undefined}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

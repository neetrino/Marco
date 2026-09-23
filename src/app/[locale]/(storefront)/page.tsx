import { Montserrat } from "next/font/google";
import { notFound } from "next/navigation";

import { listStorefrontBrands } from "@/features/brands/application/list-storefront-brands";
import { getHeaderCategoryMenu } from "@/features/categories/application/load-header-category-menu";
import { listActiveHeroSlides } from "@/features/hero/application/queries";
import { mapProductCards } from "@/features/products/map-product-cards";
import { HomeBrands } from "@/features/home/ui/HomeBrands";
import { HomeCategories } from "@/features/home/ui/HomeCategories";
import { HomeFeaturedProducts } from "@/features/home/ui/HomeFeaturedProducts";
import { HomeFloorBanners } from "@/features/home/ui/HomeFloorBanners";
import { HomeMobileCopyright } from "@/features/home/ui/HomeMobileCopyright";
import { HomeHero } from "@/features/home/ui/HomeHero";
import { listActiveStorefrontReels } from "@/features/reels/application/queries";
import { HomeReels } from "@/features/reels/ui/HomeReels";
import {
  getFeaturedProducts,
  getNewestProducts,
} from "@/features/products/queries";
import { getCompareProductIds } from "@/features/compare/queries";
import { getWishlistProductIds } from "@/features/wishlist/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import {
  createDisplayPriceFormatter,
  getSelectedCurrency,
} from "@/lib/money/display-price";

const montserratHome = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700", "900"],
  display: "swap",
});

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const dictionary = getDictionary(locale);
  const [
    heroSlides,
    featuredProducts,
    newestProducts,
    brands,
    currency,
    user,
    homeReels,
    categoryMenu,
  ] = await Promise.all([
    listActiveHeroSlides(locale),
    getFeaturedProducts(locale),
    getNewestProducts(locale),
    listStorefrontBrands(locale),
    getSelectedCurrency(),
    getCurrentUser(),
    listActiveStorefrontReels(locale),
    getHeaderCategoryMenu(locale),
  ]);
  const catalogIds = [
    ...new Set([
      ...featuredProducts.map((product) => product.id),
      ...newestProducts.map((product) => product.id),
    ]),
  ];
  const [wishlistIds, compareIds, formatPrice] = await Promise.all([
    getWishlistProductIds(catalogIds),
    getCompareProductIds(),
    createDisplayPriceFormatter(locale, currency),
  ]);

  const featuredCards = mapProductCards(
    featuredProducts,
    locale,
    formatPrice,
    dictionary.product,
    wishlistIds,
    compareIds,
  );
  const newestCards = mapProductCards(
    newestProducts,
    locale,
    formatPrice,
    dictionary.product,
    wishlistIds,
    compareIds,
  );

  const productRail = {
    locale,
    viewAllLabel: dictionary.home.viewAll,
    viewAllHref: `/${locale}/products`,
    wishlistLabel: dictionary.nav.wishlist,
    compareLabel: dictionary.nav.compare,
    addToCartLabel: dictionary.product.addToCart,
    previousPageLabel: dictionary.catalog.previousPage,
    nextPageLabel: dictionary.catalog.nextPage,
    paginationLabel: dictionary.home.productsPaginationLabel,
    isSignedIn: Boolean(user),
  };

  return (
    <div className={`${montserratHome.className} -mx-4 -my-10 bg-white sm:-mx-6 lg:-mx-8`}>
      <HomeHero slides={heroSlides} />
      <HomeCategories
        locale={locale}
        title={dictionary.catalog.categories}
        allLabel={dictionary.catalog.allCategories}
        previousPageLabel={dictionary.catalog.previousPage}
        nextPageLabel={dictionary.catalog.nextPage}
        categories={categoryMenu}
      />
      <HomeReels
        title={dictionary.home.reelsTitle}
        playLabel={dictionary.home.playReel}
        closeLabel={dictionary.home.closeReel}
        muteLabel={dictionary.home.muteReel}
        unmuteLabel={dictionary.home.unmuteReel}
        previousPageLabel={dictionary.catalog.previousPage}
        nextPageLabel={dictionary.catalog.nextPage}
        paginationLabel={dictionary.home.reelsPaginationLabel}
        reels={homeReels}
      />
      <HomeFeaturedProducts
        {...productRail}
        headingId="home-special-offers"
        title={dictionary.home.featuredTitle}
        titleHighlight={dictionary.home.featuredTitleHighlight}
        titleRest={dictionary.home.featuredTitleRest}
        emptyLabel={dictionary.home.emptyFeatured}
        products={featuredCards}
      />
      <HomeFeaturedProducts
        {...productRail}
        headingId="home-new-arrivals"
        priorityCount={0}
        title={dictionary.home.newArrivalsTitle}
        emptyLabel={dictionary.home.emptyNewArrivals}
        products={newestCards}
      />
      <HomeBrands
        locale={locale}
        title={dictionary.home.brandsTitle}
        viewAllLabel={dictionary.home.viewAll}
        viewAllHref={`/${locale}/brand`}
        emptyLabel={dictionary.catalog.brandsEmpty}
        paginationLabel={dictionary.home.brandsPaginationLabel}
        previousPageLabel={dictionary.catalog.previousPage}
        nextPageLabel={dictionary.catalog.nextPage}
        brands={brands}
      />
      <HomeFloorBanners
        locale={locale}
        slides={heroSlides}
        copy={{
          appBannerSection: dictionary.home.appBannerSection,
          appBannerAlt: dictionary.home.appBannerAlt,
          promoLeftAria: dictionary.home.promoLeftAria,
          promoRightAria: dictionary.home.promoRightAria,
          promoLeftCta: dictionary.home.promoLeftCta,
          promoRightCta: dictionary.home.promoRightCta,
        }}
      />
      <HomeMobileCopyright
        copyrightBefore={dictionary.home.mobileCopyrightBefore}
        creditStudio={dictionary.footer.creditStudio}
      />
    </div>
  );
}

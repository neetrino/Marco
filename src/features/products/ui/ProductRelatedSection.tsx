import { mapProductCards } from "@/features/products/map-product-cards";
import { ProductRelatedRail } from "@/features/products/ui/ProductRelatedRail";
import { getCompareProductIds } from "@/features/compare/queries";
import { getRelatedProducts } from "@/features/products/queries";
import { getWishlistProductIds } from "@/features/wishlist/queries";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { createDisplayPriceFormatter } from "@/lib/money/display-price";
import type { Currency } from "@/lib/money/currency";

type ProductRelatedSectionProps = {
  locale: Locale;
  productId: string;
  currency: Currency;
  isSignedIn: boolean;
  dictionary: Dictionary;
};

/** Streams below the PDP fold — does not block gallery/purchase chrome. */
export async function ProductRelatedSection({
  locale,
  productId,
  currency,
  isSignedIn,
  dictionary,
}: ProductRelatedSectionProps) {
  const related = await getRelatedProducts(locale, productId);
  if (related.length === 0) {
    return null;
  }

  const [wishlistIds, compareIds, formatPrice] = await Promise.all([
    getWishlistProductIds(related.map((item) => item.id)),
    getCompareProductIds(),
    createDisplayPriceFormatter(locale, currency),
  ]);
  const cards = mapProductCards(
    related,
    locale,
    formatPrice,
    dictionary.product,
    wishlistIds,
    compareIds,
  );

  return (
    <ProductRelatedRail
      locale={locale}
      title={dictionary.product.related}
      previousPageLabel={dictionary.catalog.previousPage}
      nextPageLabel={dictionary.catalog.nextPage}
      paginationLabel={dictionary.home.productsPaginationLabel}
      wishlistLabel={dictionary.nav.wishlist}
      compareLabel={dictionary.nav.compare}
      addToCartLabel={dictionary.product.addToCart}
      isSignedIn={isSignedIn}
      products={cards}
    />
  );
}

import { AppLink } from "@/components/ui/AppLink";

import { resolveDisplayDiscountPercent } from "@/features/products/domain/product-discount";
import { parseProductSpecs } from "@/features/products/domain/product-specs";
import { catalogHref } from "@/features/products/domain/catalog-href";
import { EMPTY_CATALOG_SEARCH } from "@/features/products/domain/catalog-search-params";
import type { ProductDetail } from "@/features/products/types";
import {
  ProductWarrantyBadge,
  warrantyLabelForYears,
} from "@/features/products/ui/ProductCardMeta";
import {
  ProductShortText,
  ProductSpecificationsTable,
} from "@/features/products/ui/ProductDescriptionBlocks";
import { ProductGallery } from "@/features/products/ui/ProductGallery";
import { ProductPurchaseControls } from "@/features/products/ui/ProductPurchaseControls";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

type ProductDetailViewProps = {
  locale: Locale;
  product: ProductDetail;
  priceFormatted: string;
  compareAtFormatted: string | null;
  isSignedIn: boolean;
  inWishlist: boolean;
  inCompare: boolean;
  dictionary: Dictionary;
  jsonLd: Record<string, unknown>;
  relatedSlot: React.ReactNode;
};

export function ProductDetailView({
  locale,
  product,
  priceFormatted,
  compareAtFormatted,
  isSignedIn,
  inWishlist,
  inCompare,
  dictionary,
  jsonLd,
  relatedSlot,
}: ProductDetailViewProps) {
  const labels = dictionary.product;
  const warrantyLabel = warrantyLabelForYears(product.warrantyYears, labels);
  const specRows = parseProductSpecs(product.translation.specifications);
  const primaryCategory = product.categories[0] ?? null;

  return (
    <article className="-mx-4 -my-10 flex flex-col bg-white px-4 pt-4 pb-24 sm:-mx-6 sm:px-6 sm:pt-8 md:pb-16 lg:-mx-8 lg:px-8 lg:py-12">
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:gap-12">
        <ProductGallery
          images={product.images}
          title={product.translation.title}
          tags={product.tags}
          discountPercent={resolveDisplayDiscountPercent(product)}
          labels={{
            fullscreenImage: labels.fullscreenImage,
            previousImage: labels.previousImage,
            nextImage: labels.nextImage,
            closeLightbox: labels.closeLightbox,
          }}
        />

        <div className="flex flex-col lg:min-h-[420px]">
          <div className="lg:flex-1">
            <ProductInfoHeader
              locale={locale}
              title={product.translation.title}
              sku={product.sku}
              skuLabel={labels.sku}
              category={primaryCategory}
              warrantyLabel={warrantyLabel}
              warrantyYears={product.warrantyYears}
              warrantyCaption={labels.warrantyBadge}
              warrantySuffix={labels.warrantyYearsSuffix}
            />
            <ProductPriceBlock
              priceFormatted={priceFormatted}
              compareAtFormatted={compareAtFormatted}
            />
            <div className="mb-4 lg:mb-8">
              <ProductShortText
                html={
                  product.translation.subtitle ??
                  product.translation.description ??
                  ""
                }
              />
            </div>
          </div>
          <ProductPurchaseControls
            locale={locale}
            productId={product.id}
            stockOnHand={product.stockOnHand}
            inWishlist={inWishlist}
            inCompare={inCompare}
            isSignedIn={isSignedIn}
            wishlistLabel={dictionary.nav.wishlist}
            compareLabel={dictionary.nav.compare}
            imageUrl={product.images[0]?.url ?? null}
            labels={{
              quantity: labels.quantity,
              decreaseQuantity: dictionary.cartDrawer.decreaseQuantity,
              increaseQuantity: dictionary.cartDrawer.increaseQuantity,
              buyNow: labels.buyNow,
              adding: labels.adding,
              outOfStock: labels.outOfStock,
              added: labels.added,
              error: labels.addError,
            }}
          />
        </div>
      </div>

      <div className="mt-6 md:mt-12 lg:mt-24">
        <ProductSpecificationsTable
          title={labels.specifications}
          rows={specRows}
        />
      </div>

      {relatedSlot}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </article>
  );
}

function ProductInfoHeader({
  locale,
  title,
  sku,
  skuLabel,
  category,
  warrantyLabel,
  warrantyYears,
  warrantyCaption,
  warrantySuffix,
}: {
  locale: Locale;
  title: string;
  sku: string;
  skuLabel: string;
  category: { title: string; slug: string } | null;
  warrantyLabel: string | null;
  warrantyYears: number;
  warrantyCaption: string;
  warrantySuffix: string;
}) {
  const categoryHref = category
    ? catalogHref(locale, {
        ...EMPTY_CATALOG_SEARCH,
        categorySlugs: [category.slug],
      })
    : null;

  return (
    <>
      {category && categoryHref ? (
        <div className="mb-5">
          <AppLink
            href={categoryHref}
            className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
          >
            {category.title}
          </AppLink>
        </div>
      ) : null}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-marco-slate sm:text-3xl md:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {skuLabel}:{" "}
            <span className="font-medium text-gray-700">{sku}</span>
          </p>
        </div>
        {warrantyLabel ? (
          <ProductWarrantyBadge
            yearsLabel={warrantyLabel}
            caption={warrantyCaption}
            years={warrantyYears}
            yearsSuffix={warrantySuffix}
            size="promo"
            className="shrink-0"
          />
        ) : null}
      </div>
    </>
  );
}

function ProductPriceBlock({
  priceFormatted,
  compareAtFormatted,
}: {
  priceFormatted: string;
  compareAtFormatted: string | null;
}) {
  return (
    <div className="mb-6 flex flex-col gap-1">
      <p className="text-3xl font-bold text-marco-ink">{priceFormatted}</p>
      {compareAtFormatted ? (
        <p className="mt-1 ml-px text-xl text-gray-500 line-through decoration-gray-400">
          {compareAtFormatted}
        </p>
      ) : null}
    </div>
  );
}

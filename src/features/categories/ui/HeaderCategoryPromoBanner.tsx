import Image from "next/image";

import {
  headerCategoryPromoHeadline,
  headerCategoryPromoImageUrl,
} from "@/features/categories/domain/header-category-promo";
import {
  HEADER_CATEGORY_PROMO_CARD_CLASS,
  HEADER_CATEGORY_PROMO_CONTENT_CLASS,
  HEADER_CATEGORY_PROMO_HEADLINE_CLASS,
  HEADER_CATEGORY_PROMO_IMAGE_WRAP_CLASS,
} from "@/features/categories/ui/header-category-menu.classes";

type HeaderCategoryPromoBannerProps = {
  bannerImageUrl?: string | null;
  drawerTitle?: string | null;
};

/** Admin-authored promo card above the mega-menu subcategory grid. */
export function HeaderCategoryPromoBanner({
  bannerImageUrl = null,
  drawerTitle = null,
}: HeaderCategoryPromoBannerProps) {
  const headline = headerCategoryPromoHeadline(drawerTitle);
  const imageUrl = headerCategoryPromoImageUrl(bannerImageUrl);
  if (!headline && !imageUrl) return null;

  return (
    <div
      className={`${HEADER_CATEGORY_PROMO_CARD_CLASS}${
        imageUrl && !headline ? " min-h-[180px]" : ""
      }`}
    >
      {imageUrl ? (
        <div className={HEADER_CATEGORY_PROMO_IMAGE_WRAP_CLASS} aria-hidden>
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="280px"
            className="object-contain object-right-bottom opacity-90"
          />
        </div>
      ) : null}
      {headline ? (
        <div className={HEADER_CATEGORY_PROMO_CONTENT_CLASS}>
          <h2 className={HEADER_CATEGORY_PROMO_HEADLINE_CLASS}>{headline}</h2>
        </div>
      ) : null}
    </div>
  );
}

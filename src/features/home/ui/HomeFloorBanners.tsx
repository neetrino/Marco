import { pickHomeFloorBanners } from "@/features/hero/domain/hero-layout";
import type { StorefrontHeroSlide } from "@/features/hero/application/queries";
import { HomeAppBanner } from "@/features/home/ui/HomeAppBanner";
import { HOME_FLOOR_BANNERS_PADDING_CLASS } from "@/features/home/ui/home-floor-banners.constants";
import { HomeMobileFloorBanner } from "@/features/home/ui/HomeMobileFloorBanner";
import { HomePromoBanners } from "@/features/home/ui/HomePromoBanners";
import type { Locale } from "@/lib/i18n/config";

type HomeFloorCopy = {
  appBannerSection: string;
  appBannerAlt: string;
  promoLeftAria: string;
  promoRightAria: string;
  promoLeftCta: string;
  promoRightCta: string;
};

type HomeFloorBannersProps = {
  locale: Locale;
  slides: StorefrontHeroSlide[];
  copy: HomeFloorCopy;
};

function catalogHref(locale: Locale, buttonUrl?: string): string {
  const url = buttonUrl?.trim();
  return url || `/${locale}/products`;
}

/** App download + promo strip after brands — only CMS uploads, no static fallbacks. */
export function HomeFloorBanners({
  locale,
  slides,
  copy,
}: HomeFloorBannersProps) {
  const floor = pickHomeFloorBanners(slides);
  const appImage = floor.appDownload?.desktopImageUrl ?? null;
  const promoLeftImage =
    floor.promoLeft?.desktopImageUrl ??
    floor.promoLeft?.mobileImageUrl ??
    null;
  const promoRightImage =
    floor.promoRight?.desktopImageUrl ??
    floor.promoRight?.mobileImageUrl ??
    null;
  const mobileFloorImage =
    floor.promoLeft?.mobileImageUrl ??
    floor.promoLeft?.desktopImageUrl ??
    null;

  if (!appImage && !promoLeftImage && !promoRightImage && !mobileFloorImage) {
    return null;
  }

  return (
    <div className={`w-full ${HOME_FLOOR_BANNERS_PADDING_CLASS}`}>
      {appImage ? (
        <HomeAppBanner
          imageUrl={appImage}
          sectionLabel={copy.appBannerSection}
          imageAlt={copy.appBannerAlt}
        />
      ) : null}
      {mobileFloorImage ? (
        <HomeMobileFloorBanner
          imageUrl={mobileFloorImage}
          href={catalogHref(locale, floor.promoLeft?.copy.buttonUrl)}
          ariaLabel={`${copy.promoLeftCta}. ${copy.promoLeftAria}`}
          ctaLabel={copy.promoLeftCta}
        />
      ) : null}
      <HomePromoBanners
        left={{
          imageUrl: promoLeftImage,
          href: catalogHref(locale, floor.promoLeft?.copy.buttonUrl),
          ariaLabel: `${copy.promoLeftCta}. ${copy.promoLeftAria}`,
          ctaLabel: copy.promoLeftCta,
        }}
        right={{
          imageUrl: promoRightImage,
          href: catalogHref(locale, floor.promoRight?.copy.buttonUrl),
          ariaLabel: `${copy.promoRightCta}. ${copy.promoRightAria}`,
          ctaLabel: copy.promoRightCta,
        }}
      />
    </div>
  );
}

import Image from "next/image";

import { AppLink } from "@/components/ui/AppLink";
import { HomeBannerCta } from "@/features/home/ui/HomeBannerCta";
import { HOME_PROMO_RADIUS_PX } from "@/features/home/ui/home-floor-banners.constants";
import { HOME_PAGE_SHELL_CLASS } from "@/features/home/ui/home-section-classes";

const HOME_MOBILE_FLOOR_IMAGE_SIZES =
  "(max-width: 640px) calc(100vw - 2rem), (max-width: 768px) calc(100vw - 3rem), 0px";

type HomeMobileFloorBannerProps = {
  imageUrl: string;
  href: string;
  ariaLabel: string;
  ctaLabel: string;
};

/** Promo floor card below brands on mobile — matches 3001. */
export function HomeMobileFloorBanner({
  imageUrl,
  href,
  ariaLabel,
  ctaLabel,
}: HomeMobileFloorBannerProps) {
  return (
    <div className="w-full bg-white px-0 pb-8 pt-10 md:hidden">
      <div className={HOME_PAGE_SHELL_CLASS}>
        <AppLink
          href={href}
          prefetchPolicy="intent"
          aria-label={ariaLabel}
          className="relative block aspect-[522/372] w-full overflow-hidden"
          style={{ borderRadius: HOME_PROMO_RADIUS_PX }}
        >
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes={HOME_MOBILE_FLOOR_IMAGE_SIZES}
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-x-4 bottom-4">
            <HomeBannerCta label={ctaLabel} variant="yellow" decorative />
          </div>
        </AppLink>
      </div>
    </div>
  );
}

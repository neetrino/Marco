/** SuperSudo hero-banner preview frames. */
export const HERO_DESKTOP_PREVIEW_CLASS = "aspect-[141/68] w-full";
/** Figma MARCO-NEW mobile hero frame `1:2779` — 399×288, radius 24. */
export const HERO_MOBILE_PREVIEW_CLASS = "aspect-[399/288] w-full";

export const HERO_DESKTOP_RADIUS_CLASS = "rounded-[30px]";
export const HERO_MOBILE_RADIUS_CLASS = "rounded-[24px]";

/** Matches storefront `HomeAppBanner` raster — 2306×861. */
export const APP_DOWNLOAD_PREVIEW_CLASS = "aspect-[2306/861] w-full";
export const APP_DOWNLOAD_RADIUS_CLASS = "rounded-[32px]";

/** Matches storefront promo left tile — 56 / 34. */
export const PROMO_LEFT_PREVIEW_CLASS = "aspect-[56/34] w-full";
export const PROMO_TILE_RADIUS_CLASS = "rounded-2xl";
export const PROMO_STRIP_GRID_CLASS =
  "grid w-full grid-cols-1 items-stretch gap-4 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]";

/** Matches mobile floor promo card. */
export const MOBILE_FLOOR_PREVIEW_CLASS = "aspect-[522/372] w-full";

export function heroBannerTabClass(isActive: boolean): string {
  return isActive
    ? "border-marco-yellow bg-marco-yellow text-marco-slate shadow-sm"
    : "border-gray-200 bg-white text-marco-slate/70 hover:border-marco-yellow/60 hover:bg-marco-yellow/20 hover:text-marco-ink";
}

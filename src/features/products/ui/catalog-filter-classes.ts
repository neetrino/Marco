export const CATALOG_LAYOUT =
  "flex flex-col gap-6 min-[744px]:flex-row min-[744px]:items-start min-[744px]:gap-5 xl:gap-8";

export const CATALOG_FILTER_ASIDE =
  "hidden w-[16rem] shrink-0 border-r border-[#e2e8f0] bg-white pb-4 pr-3 min-[744px]:flex min-[744px]:flex-col min-[744px]:self-start xl:w-[20rem] xl:pb-6 xl:pr-6";

export const CATALOG_FILTER_SECTION =
  "mb-4 border-b border-solid border-[#e2e8f0] pb-4 last:mb-0 last:border-b-0";

export const CATALOG_FILTER_TITLE =
  "mb-4 text-base font-semibold leading-6 tracking-[-0.31px] text-marco-slate";

export const CATALOG_FILTER_ROW =
  "flex min-w-0 flex-1 items-center gap-3 text-left text-base leading-6 tracking-[0.16px]";

export const CATALOG_FILTER_COUNT =
  "shrink-0 whitespace-nowrap text-base leading-6 tracking-[-0.31px] text-[#90a1b9]";

export const CATALOG_CHECKBOX_BOX =
  "flex size-5 shrink-0 items-center justify-center rounded border-2 border-solid";

export const CATALOG_FILTER_LIST = "flex flex-col gap-3";

export const CATALOG_FILTER_ROW_SELECTED =
  "rounded-full bg-marco-gray py-1 pl-1 pr-2";

export const CATALOG_PRICE_TITLE =
  "shrink-0 text-sm font-semibold leading-6 tracking-[-0.31px] text-marco-slate lg:text-base";

export const CATALOG_PRICE_VALUE =
  "min-w-0 flex-1 truncate text-right text-xs font-bold leading-6 tracking-[-0.31px] text-marco-slate lg:text-base";

export const CATALOG_PRICE_TRACK = "relative h-2 w-full rounded-full bg-[#e2e8f0]";

export type CatalogFilterCheckboxVariant = "checkmark" | "filled";

export function catalogFilterCategoryLabelClass(
  selected: boolean,
  isTopLevel: boolean,
): string {
  if (selected || isTopLevel) return "font-semibold text-marco-slate";
  return "font-normal text-marco-slate";
}

export function catalogFilterBrandLabelClass(selected: boolean): string {
  return selected ? "font-semibold text-marco-slate" : "font-normal text-marco-slate";
}

export function catalogFilterCheckboxToneClass(
  selected: boolean,
  variant: CatalogFilterCheckboxVariant,
): string {
  if (!selected) return "border-[#cad5e2] bg-white";
  if (variant === "checkmark") return "border-marco-ink bg-white";
  return "border-marco-ink bg-marco-ink";
}

export function catalogFilterCheckIconClass(
  variant: CatalogFilterCheckboxVariant,
): string {
  return variant === "checkmark" ? "text-marco-ink" : "text-white";
}

export const CATALOG_MOBILE_FILTER_BUTTON =
  "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-[#dedede] bg-white px-4 text-sm font-semibold text-marco-slate transition-colors hover:bg-marco-gray/50";

export const CATALOG_SORT_TRIGGER =
  "flex h-10 w-auto max-w-full shrink-0 items-center gap-1.5 rounded-full border border-solid border-[#dedede] bg-white px-3 text-sm font-normal leading-normal text-marco-black/80 transition-colors hover:bg-marco-gray/50";

export const CATALOG_PRICE_PRESENCE_GROUP =
  "flex h-10 min-h-10 shrink-0 items-stretch overflow-hidden rounded-full border border-solid border-marco-ink/20 bg-white";

export const CATALOG_VIEW_TOGGLE_GROUP =
  "flex h-10 min-h-10 shrink-0 items-stretch overflow-hidden rounded-full border border-solid border-[#dedede] bg-white";

export function catalogPricePresenceSegmentClass(
  active: boolean,
  compact: boolean,
): string {
  const size = compact
    ? "min-w-[112px] gap-1.5 px-4 text-sm"
    : "min-w-0 flex-1 gap-1 px-2 text-xs sm:px-4 sm:text-sm";
  const tone = active
    ? "bg-marco-gray text-marco-slate"
    : "bg-white text-marco-black/80 hover:bg-marco-gray/50";
  return `inline-flex items-center justify-center whitespace-nowrap font-semibold border-r border-marco-black/15 last:border-r-0 ${size} ${tone}`;
}

export function catalogViewToggleSegmentClass(active: boolean): string {
  const tone = active
    ? "bg-marco-gray text-marco-slate"
    : "bg-white text-marco-black/70 hover:bg-marco-gray/50";
  return `inline-flex min-w-[44px] flex-1 items-center justify-center px-3 border-r border-[#dedede] last:border-r-0 ${tone}`;
}

export const CATALOG_PAGE_TITLE =
  "font-bold uppercase leading-none tracking-[-0.6px] text-marco-slate text-[clamp(1.25rem,3.2vw,1.75rem)] sm:text-3xl lg:text-[36px]";

export const CATALOG_PAGE_TITLE_BAR = "mt-2 h-1 w-20 shrink-0 rounded-sm bg-marco-yellow";

export const CATALOG_GRID =
  "grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-4 sm:gap-y-12 md:grid-cols-3 md:gap-x-6 md:gap-y-12";

export const HEADER_CATEGORY_PROMO_KEYS = [
  "furniture",
  "hardware",
  "generic",
] as const;

export type HeaderCategoryPromoKey = (typeof HEADER_CATEGORY_PROMO_KEYS)[number];

const HARDWARE_SLUG_ALIASES = [
  "kahovyqi-patrastman-paraganer",
  "kahovyqi-patrastman-paraganer-3",
  "furniture-hardware",
  "furniture-making",
  "furniture-accessories",
  "mebelnaya-furnitura",
  "կահույքի-պատրաստման-պարագաներ",
  "կահույքի-պատրաստման-համար-պարականեր",
] as const;

const FURNITURE_SLUG_ALIASES = [
  "kahovyq",
  "kahuyq",
  "furniture",
  "mebel",
  "կահույք",
] as const;

const HARDWARE_TITLE_ALIASES = [
  "կահույքի պատրաստման",
  "furniture hardware",
  "furniture-making",
  "мебельная фурнитура",
  "фурнитур",
] as const;

const FURNITURE_TITLE_ALIASES = [
  "կահույք",
  "furniture",
  "мебель",
] as const;

function matchesSlugAlias(
  slug: string,
  aliases: readonly string[],
): boolean {
  return aliases.some(
    (alias) => slug === alias || slug.startsWith(`${alias}-`),
  );
}

function matchesTitleAlias(
  title: string,
  aliases: readonly string[],
): boolean {
  return aliases.some(
    (alias) => title === alias || title.includes(alias),
  );
}

/**
 * Maps a root category to furniture / hardware / generic.
 * Used for catalog filters and mobile card visuals — not for drawer promo copy.
 */
export function resolveHeaderCategoryPromo(
  slug: string,
  title = "",
): HeaderCategoryPromoKey {
  const normalizedSlug = slug.trim().toLowerCase();
  const normalizedTitle = title.trim().toLowerCase();
  if (
    matchesSlugAlias(normalizedSlug, HARDWARE_SLUG_ALIASES) ||
    matchesTitleAlias(normalizedTitle, HARDWARE_TITLE_ALIASES)
  ) {
    return "hardware";
  }
  if (
    matchesSlugAlias(normalizedSlug, FURNITURE_SLUG_ALIASES) ||
    matchesTitleAlias(normalizedTitle, FURNITURE_TITLE_ALIASES)
  ) {
    return "furniture";
  }
  return "generic";
}

/** Admin-uploaded drawer banner only — no static furniture/hardware fallback. */
export function headerCategoryPromoImageUrl(
  uploadedUrl?: string | null,
): string | null {
  const url = uploadedUrl?.trim();
  return url ? url : null;
}

/** Admin drawer title only — no static headline fallback. */
export function headerCategoryPromoHeadline(
  drawerTitle?: string | null,
): string | null {
  const title = drawerTitle?.trim();
  return title ? title : null;
}

/** True when the category has admin promo content to show in the drawer. */
export function hasHeaderCategoryPromo(
  drawerTitle?: string | null,
  bannerImageUrl?: string | null,
): boolean {
  return (
    headerCategoryPromoHeadline(drawerTitle) != null ||
    headerCategoryPromoImageUrl(bannerImageUrl) != null
  );
}

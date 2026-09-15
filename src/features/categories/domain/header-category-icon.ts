import {
  mobileCatalogIconSrc,
  resolveMobileCatalogIconKey,
} from "@/features/categories/domain/mobile-catalog-icon";

export const HEADER_CATEGORY_ICON_BASE = "/assets/header-category/icons";

export const HEADER_CATEGORY_ICON_KEYS = [
  "furniture-hardware",
  "climate",
  "water-dispenser",
  "audio-video",
  "kitchen-appliances",
  "large-appliances",
  "home-appliances",
  "electronics",
  "furniture",
] as const;

export type HeaderCategoryIconKey = (typeof HEADER_CATEGORY_ICON_KEYS)[number];

type IconRule = {
  key: HeaderCategoryIconKey;
  aliases: readonly string[];
  /** Exact slug/title only — avoids furniture children matching the root glyph. */
  exact?: boolean;
};

const ICON_RULES: readonly IconRule[] = [
  {
    key: "furniture-hardware",
    aliases: [
      "kahovyqi-patrastman",
      "furniture-hardware",
      "furniture-making",
      "furniture-accessories",
      "mebelnaya-furnitura",
      "պատրաստման պարագ",
      "фурнитур",
    ],
  },
  {
    key: "climate",
    aliases: [
      "odorakich",
      "օդորակիչ",
      "տաքացուցիչ",
      "heater",
      "кондицион",
      "обогревател",
      "climate",
      "hvac",
      "air-conditioner",
    ],
  },
  {
    key: "water-dispenser",
    aliases: [
      "dispenser",
      "water-cooler",
      "դիսպենս",
      "կուլեր",
      "кулер",
      "диспенс",
    ],
  },
  {
    key: "audio-video",
    aliases: [
      "audio",
      "աուդիո",
      "аудио",
      "վիդեո",
      "видео",
      "herust",
      "հեռուստ",
      "телевиз",
      "audio-video",
      "tv-audio",
    ],
  },
  {
    key: "kitchen-appliances",
    aliases: [
      "xohanoc",
      "խոհանոց",
      "кухн",
      "kitchen",
    ],
  },
  {
    key: "large-appliances",
    aliases: [
      "խոշոր կենցաղ",
      "khoshor",
      "khshor",
      "large-appliance",
      "major-appliance",
      "white-goods",
      "սառնարան",
      "холодильн",
      "լվացքի",
      "стиральн",
      "fridge",
      "refrigerator",
    ],
  },
  {
    key: "home-appliances",
    aliases: [
      "կենցաղային",
      "kencaxayin",
      "household",
      "small-appliance",
      "home-appliance",
      "бытов",
    ],
  },
  {
    key: "electronics",
    aliases: [
      "texnika-ev-elektronika",
      "տեխնիկա և էլեկտրոնիկա",
      "техника и электроника",
      "electronics",
    ],
    exact: true,
  },
  {
    key: "furniture",
    aliases: ["kahovyq", "kahuyq", "furniture", "mebel", "կահույք", "мебель"],
    exact: true,
  },
];

const ICON_FILE: Record<HeaderCategoryIconKey, string> = {
  "furniture-hardware": "furniture-hardware.svg",
  climate: "climate.svg",
  "water-dispenser": "water-dispenser.svg",
  "audio-video": "audio-video.svg",
  "kitchen-appliances": "kitchen-appliances.svg",
  "large-appliances": "home-and-garden.svg",
  "home-appliances": "home-appliances.svg",
  electronics: "electronics.svg",
  furniture: "furniture.svg",
};

function normalizeCategoryKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function matchesAlias(
  slug: string,
  title: string,
  aliases: readonly string[],
  exact: boolean,
): boolean {
  const normalizedSlug = normalizeCategoryKey(slug);
  const normalizedTitle = normalizeCategoryKey(title);
  return aliases.some((alias) => {
    const normalizedAlias = normalizeCategoryKey(alias);
    if (exact) {
      return (
        normalizedSlug === normalizedAlias || normalizedTitle === normalizedAlias
      );
    }
    return (
      normalizedSlug === normalizedAlias ||
      normalizedTitle === normalizedAlias ||
      normalizedSlug.includes(normalizedAlias) ||
      normalizedTitle.includes(normalizedAlias) ||
      normalizedSlug.startsWith(`${normalizedAlias}-`)
    );
  });
}

/** Picks a mega-menu Figma icon key, or null to use the catalog keyword fallback. */
export function resolveHeaderCategoryIconKey(
  slug: string,
  title = "",
): HeaderCategoryIconKey | null {
  for (const rule of ICON_RULES) {
    if (matchesAlias(slug, title, rule.aliases, rule.exact === true)) {
      return rule.key;
    }
  }
  return null;
}

export function headerCategoryIconSrc(key: HeaderCategoryIconKey): string {
  return `${HEADER_CATEGORY_ICON_BASE}/${ICON_FILE[key]}`;
}

/**
 * Icon URL for a mega-menu row: admin upload, then Figma nav glyph,
 * then mobile catalog keyword SVG.
 */
export function resolveHeaderCategoryIconUrl(
  slug: string,
  title: string,
  uploadedUrl: string | null,
): string {
  if (uploadedUrl && uploadedUrl.trim() !== "") return uploadedUrl.trim();
  const headerKey = resolveHeaderCategoryIconKey(slug, title);
  if (headerKey) return headerCategoryIconSrc(headerKey);
  return mobileCatalogIconSrc(resolveMobileCatalogIconKey(slug, title));
}

/** Same as the storefront icon, or null when the admin row has no name yet. */
export function resolveAdminCategoryIconUrl(
  slug: string,
  title: string,
  uploadedUrl: string | null,
): string | null {
  if (uploadedUrl?.trim()) return uploadedUrl.trim();
  if (!slug.trim() && !title.trim()) return null;
  return resolveHeaderCategoryIconUrl(slug, title, null);
}

export function isSvgImageSrc(src: string): boolean {
  const path = src.split("?")[0] ?? src;
  return path.endsWith(".svg");
}

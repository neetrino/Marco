/**
 * Resolves a Figma-styled line icon for a mobile catalog category row.
 * Prefers admin-uploaded `imageUrl`; otherwise maps slug/title keywords.
 */

export const MOBILE_CATALOG_ICON_BASE = "/assets/mobile-catalog/icons";

export const MOBILE_CATALOG_ICON_KEYS = [
  "sofa",
  "bed",
  "chair",
  "board",
  "accessory",
  "sponge",
  "tv",
  "audio",
  "kitchen",
  "generic",
] as const;

export type MobileCatalogIconKey = (typeof MOBILE_CATALOG_ICON_KEYS)[number];

type IconRule = {
  key: MobileCatalogIconKey;
  aliases: readonly string[];
};

const ICON_RULES: readonly IconRule[] = [
  {
    key: "sofa",
    aliases: [
      "papuk",
      "փափուկ",
      "sofa",
      "мягк",
      "диван",
      "bnakaran",
      "բազմոց",
    ],
  },
  {
    key: "bed",
    aliases: [
      "nnj",
      "ննջ",
      "bed",
      "спальн",
      "մահճակալ",
      "mahchakal",
    ],
  },
  {
    key: "board",
    aliases: [
      "lamin",
      "լամին",
      "дсп",
      "двп",
      "мдф",
      "դսպ",
      "դվպ",
      "մդֆ",
      "osb",
      "օսբ",
      "օսպ",
      "saler",
      "սալ",
      "սեղանածածկ",
      "столеш",
      "chipboard",
      "mdf",
      "dsp",
      "dvp",
    ],
  },
  {
    key: "sponge",
    aliases: [
      "spung",
      "սպունգ",
      "sponge",
      "поролон",
      "porolon",
      "foam",
    ],
  },
  {
    key: "accessory",
    aliases: [
      "aksesuar",
      "աքսեսուար",
      "accessori",
      "фурнитур",
      "hinge",
      "knob",
      "ծխն",
      "կոճակ",
      "ручка",
    ],
  },
  {
    key: "tv",
    aliases: [
      "herust",
      "հեռուստ",
      "tv",
      "телевиз",
      "television",
    ],
  },
  {
    key: "audio",
    aliases: [
      "audio",
      "աուդիո",
      "аудио",
      "ձայնային",
      "sound",
      "speaker",
      "վիդեո",
      "видео",
    ],
  },
  {
    key: "kitchen",
    aliases: [
      "xohanoc",
      "խոհանոց",
      "кухн",
      "kitchen",
      "blender",
      "բլենդեր",
      "блендер",
      "kombayn",
      "կոմբայն",
      "комбайн",
      "ktratic",
      "կտրատ",
      "кофе",
      "սուրճ",
      "bambak",
      "բամբակ",
      "кофевар",
      "чайник",
      "appliance",
      "kencaxayin",
      "կենցաղային",
      "бытов",
      "odorakich",
      "օդորակիչ",
      "տաքացուցիչ",
      "кондицион",
      "dispenser",
      "դիսպենս",
      "водонагрев",
    ],
  },
  {
    key: "chair",
    aliases: [
      "kahovyq",
      "կահույք",
      "мебел",
      "furniture",
      "chair",
      "աթոռ",
      "стол",
      "սեղան",
    ],
  },
];

function matchesAlias(value: string, aliases: readonly string[]): boolean {
  return aliases.some(
    (alias) =>
      value === alias || value.includes(alias) || value.startsWith(`${alias}-`),
  );
}

/** Picks the best static icon key for a category slug/title. */
export function resolveMobileCatalogIconKey(
  slug: string,
  title = "",
): MobileCatalogIconKey {
  const haystack = `${slug.trim().toLowerCase()} ${title.trim().toLowerCase()}`;
  for (const rule of ICON_RULES) {
    if (matchesAlias(haystack, rule.aliases)) return rule.key;
  }
  return "generic";
}

/** Public asset path for a static icon key. */
export function mobileCatalogIconSrc(key: MobileCatalogIconKey): string {
  return `${MOBILE_CATALOG_ICON_BASE}/${key}.svg`;
}

/**
 * Final icon URL for a category row: uploaded image first, else keyword SVG.
 */
export function resolveMobileCatalogRowIconUrl(
  slug: string,
  title: string,
  uploadedUrl: string | null,
): string {
  if (uploadedUrl && uploadedUrl.trim() !== "") return uploadedUrl.trim();
  return mobileCatalogIconSrc(resolveMobileCatalogIconKey(slug, title));
}

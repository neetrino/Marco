export const MAX_PRODUCT_SPECS = 20;
export const MAX_SPEC_TITLE_LENGTH = 80;
export const MAX_SPEC_VALUE_LENGTH = 200;

export type ProductSpecification = {
  id: string;
  title: string;
  value: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Parses persisted specification rows, dropping empty or invalid entries. */
export function parseProductSpecs(value: unknown): ProductSpecification[] {
  if (!Array.isArray(value)) return [];
  const rows: ProductSpecification[] = [];
  for (const entry of value) {
    if (rows.length >= MAX_PRODUCT_SPECS) break;
    if (!isRecord(entry)) continue;
    const title =
      typeof entry.title === "string"
        ? entry.title.trim().slice(0, MAX_SPEC_TITLE_LENGTH)
        : "";
    const specValue =
      typeof entry.value === "string"
        ? entry.value.trim().slice(0, MAX_SPEC_VALUE_LENGTH)
        : "";
    if (!title && !specValue) continue;
    const id =
      typeof entry.id === "string" && entry.id.length > 0
        ? entry.id
        : crypto.randomUUID();
    rows.push({ id, title, value: specValue });
  }
  return rows;
}

export function createDraftProductSpec(): ProductSpecification {
  return {
    id: crypto.randomUUID(),
    title: "",
    value: "",
  };
}

const ARMENIAN_U_DIGRAPH = "ու";

/** Eastern Armenian letters → Latin, for URL slugs. */
const ARMENIAN_TO_LATIN: Record<string, string> = {
  ա: "a",
  բ: "b",
  գ: "g",
  դ: "d",
  ե: "e",
  զ: "z",
  է: "e",
  ը: "y",
  թ: "t",
  ժ: "zh",
  ի: "i",
  լ: "l",
  խ: "kh",
  ծ: "ts",
  կ: "k",
  հ: "h",
  ձ: "dz",
  ղ: "gh",
  ճ: "ch",
  մ: "m",
  յ: "y",
  ն: "n",
  շ: "sh",
  ո: "o",
  չ: "ch",
  պ: "p",
  ջ: "j",
  ռ: "r",
  ս: "s",
  վ: "v",
  տ: "t",
  ր: "r",
  ց: "ts",
  ւ: "v",
  փ: "p",
  ք: "k",
  և: "yev",
  օ: "o",
  ֆ: "f",
};

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function transliterateToLatin(value: string): string {
  const lower = value.toLowerCase();
  let result = "";
  for (let index = 0; index < lower.length; index += 1) {
    const digraph = lower.slice(index, index + ARMENIAN_U_DIGRAPH.length);
    if (digraph === ARMENIAN_U_DIGRAPH) {
      result += "u";
      index += 1;
      continue;
    }
    const char = lower[index] ?? "";
    result += ARMENIAN_TO_LATIN[char] ?? CYRILLIC_TO_LATIN[char] ?? char;
  }
  return result;
}

/** Max length of a storefront product slug (matches URL filter limits). */
export const PRODUCT_SLUG_MAX_LENGTH = 120;

/** Builds a Latin, URL-safe product slug from a title. */
export function slugifyProductTitle(title: string): string {
  const slug = transliterateToLatin(title)
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, PRODUCT_SLUG_MAX_LENGTH);

  return slug || "product";
}

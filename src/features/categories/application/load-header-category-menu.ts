import "server-only";

import { and, asc, eq, inArray, isNotNull, isNull, or } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { getDb } from "@/db/client";
import {
  categories,
  mediaAssets,
  productCategories,
  products,
  type LocaleTranslation,
} from "@/db/schema";
import {
  buildCategoryTreeWithDistinctProductCounts,
  type CategoryDistinctCountNode,
} from "@/features/categories/domain/category-distinct-product-counts";
import {
  buildCategoryTree,
  type CategoryTreeNode,
} from "@/features/categories/domain/category-tree";
import {
  omitCategoriesWithoutProducts,
  type HeaderCategoryNode,
} from "@/features/categories/domain/header-category-menu";
import {
  CACHE_TAGS,
  PUBLIC_CACHE_REVALIDATE_SECONDS,
} from "@/lib/cache/tags";
import type { Locale } from "@/lib/i18n/config";
import { mediaPublicUrl } from "@/lib/media/public-url";

type CategoryRow = {
  id: string;
  parentId: string | null;
  title: string;
  slug: string;
};

const activeProductWhere = and(
  eq(products.status, "ACTIVE"),
  isNull(products.deletedAt),
);

function translationFor(
  translations: { hy?: LocaleTranslation; en?: LocaleTranslation; ru?: LocaleTranslation },
  locale: Locale,
): LocaleTranslation | null {
  return translations[locale] ?? translations.hy ?? translations.en ?? null;
}

function groupProductIdsByCategory(
  rows: readonly { categoryId: string; productId: string }[],
): Map<string, Set<string>> {
  const productIdsByCategoryId = new Map<string, Set<string>>();
  for (const row of rows) {
    const productIds = productIdsByCategoryId.get(row.categoryId) ?? new Set();
    productIds.add(row.productId);
    productIdsByCategoryId.set(row.categoryId, productIds);
  }
  return productIdsByCategoryId;
}

function toMenuNode(
  node: CategoryDistinctCountNode,
  images: Map<string, string>,
  banners: Map<string, string>,
  drawerTitles: Map<string, string>,
): HeaderCategoryNode {
  return {
    id: node.id,
    slug: node.slug,
    title: node.title,
    count: node.count,
    imageUrl: images.get(node.id) ?? null,
    bannerImageUrl: banners.get(node.id) ?? null,
    drawerTitle: drawerTitles.get(node.id) ?? null,
    children: node.children.map((child) =>
      toMenuNode(child, images, banners, drawerTitles),
    ),
  };
}

async function loadCategoryImages(
  categoryIds: readonly string[],
): Promise<{ images: Map<string, string>; banners: Map<string, string> }> {
  const images = new Map<string, string>();
  const banners = new Map<string, string>();
  if (categoryIds.length === 0) return { images, banners };

  const mediaRows = await getDb()
    .select({
      categoryId: mediaAssets.categoryId,
      objectKey: mediaAssets.objectKey,
      role: mediaAssets.role,
      isPrimary: mediaAssets.isPrimary,
    })
    .from(mediaAssets)
    .where(
      and(
        isNotNull(mediaAssets.categoryId),
        inArray(mediaAssets.categoryId, [...categoryIds]),
        eq(mediaAssets.uploadStatus, "READY"),
        or(
          eq(mediaAssets.isPrimary, true),
          eq(mediaAssets.role, "PRIMARY"),
          eq(mediaAssets.role, "COVER"),
        ),
      ),
    );

  for (const media of mediaRows) {
    if (!media.categoryId) continue;
    const url = mediaPublicUrl(media.objectKey);
    if (media.role === "COVER") {
      if (!banners.has(media.categoryId)) banners.set(media.categoryId, url);
      continue;
    }
    if (!images.has(media.categoryId)) images.set(media.categoryId, url);
  }
  return { images, banners };
}

async function loadHeaderCategoryMenu(
  locale: Locale,
): Promise<HeaderCategoryNode[]> {
  const rows = await getDb()
    .select({
      id: categories.id,
      parentId: categories.parentId,
      translations: categories.translations,
    })
    .from(categories)
    .where(and(eq(categories.status, "ACTIVE"), isNull(categories.deletedAt)))
    .orderBy(asc(categories.sortOrder), asc(categories.createdAt));

  const mapped: CategoryRow[] = [];
  const drawerTitles = new Map<string, string>();
  for (const row of rows) {
    const translation = translationFor(row.translations, locale);
    if (!translation) continue;
    mapped.push({
      id: row.id,
      parentId: row.parentId,
      title: translation.title,
      slug: translation.slug,
    });
    const drawerTitle = translation.drawerTitle?.trim();
    if (drawerTitle) drawerTitles.set(row.id, drawerTitle);
  }

  const ids = mapped.map((row) => row.id);
  const [linkRows, media] = await Promise.all([
    ids.length === 0
      ? Promise.resolve([])
      : getDb()
          .select({
            categoryId: productCategories.categoryId,
            productId: productCategories.productId,
          })
          .from(productCategories)
          .innerJoin(products, eq(products.id, productCategories.productId))
          .where(and(activeProductWhere, inArray(productCategories.categoryId, ids))),
    loadCategoryImages(ids),
  ]);

  const tree: CategoryTreeNode<CategoryRow>[] = buildCategoryTree(mapped);
  const menu = buildCategoryTreeWithDistinctProductCounts(
    tree,
    groupProductIdsByCategory(linkRows),
  ).map((node) => toMenuNode(node, media.images, media.banners, drawerTitles));
  return omitCategoriesWithoutProducts(menu);
}

/** Published category tree for the header mega menu. */
export async function getHeaderCategoryMenu(
  locale: Locale,
): Promise<HeaderCategoryNode[]> {
  return unstable_cache(
    async () => loadHeaderCategoryMenu(locale),
    ["header-category-menu-v4", locale],
    {
      tags: [CACHE_TAGS.products],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();
}

export type HeaderCategoryNode = {
  id: string;
  slug: string;
  title: string;
  count: number;
  imageUrl: string | null;
  bannerImageUrl: string | null;
  /** Optional promo card headline from admin; falls back to static copy. */
  drawerTitle: string | null;
  children: HeaderCategoryNode[];
};

export type HeaderCategoryGroup = {
  parent: HeaderCategoryNode;
  children: HeaderCategoryNode[];
};

/** Collapsed descendant list length before “see all”. */
export const HEADER_CATEGORY_DESCENDANT_PREVIEW = 10;

/**
 * Drops categories with no active products.
 * `count` already includes descendants, so an empty node has an empty subtree.
 */
export function omitCategoriesWithoutProducts(
  nodes: readonly HeaderCategoryNode[],
): HeaderCategoryNode[] {
  const visible: HeaderCategoryNode[] = [];
  for (const node of nodes) {
    if (node.count <= 0) continue;
    visible.push({
      ...node,
      children: omitCategoriesWithoutProducts(node.children),
    });
  }
  return visible;
}

/** Groups a root’s direct children for the mega-menu content column. */
export function headerCategoryGroups(
  root: HeaderCategoryNode,
): HeaderCategoryGroup[] {
  return root.children.map((child) => ({
    parent: { ...child, children: [] },
    children: child.children,
  }));
}

/** Visible descendants before the “see all” control. */
export function visibleCategoryDescendants(
  categories: readonly HeaderCategoryNode[],
  expanded: boolean,
): HeaderCategoryNode[] {
  if (expanded) return [...categories];
  return categories.slice(0, HEADER_CATEGORY_DESCENDANT_PREVIEW);
}

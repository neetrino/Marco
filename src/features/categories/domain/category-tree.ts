export type CategoryLink = {
  id: string;
  parentId: string | null;
};

export type CategoryTreeNode<T extends CategoryLink> = T & {
  children: CategoryTreeNode<T>[];
};

export type CategoryOptionRow<T extends CategoryLink> = {
  item: T;
  depth: number;
};

function childrenByParentId<T extends CategoryLink>(
  items: ReadonlyArray<T>,
): Map<string | null, T[]> {
  const grouped = new Map<string | null, T[]>();
  const ids = new Set(items.map((item) => item.id));

  for (const item of items) {
    const parentId =
      item.parentId && ids.has(item.parentId) ? item.parentId : null;
    const siblings = grouped.get(parentId) ?? [];
    siblings.push(item);
    grouped.set(parentId, siblings);
  }

  return grouped;
}

function nestGroup<T extends CategoryLink>(
  grouped: Map<string | null, T[]>,
  parentId: string | null,
): CategoryTreeNode<T>[] {
  return (grouped.get(parentId) ?? []).map((item) => ({
    ...item,
    children: nestGroup(grouped, item.id),
  }));
}

/** Builds a forest from a flat list. Orphans with a missing parent become roots. */
export function buildCategoryTree<T extends CategoryLink>(
  items: ReadonlyArray<T>,
): CategoryTreeNode<T>[] {
  return nestGroup(childrenByParentId(items), null);
}

/** Depth-first rows for parent pickers (roots first, then nested children). */
export function flattenCategoryOptions<T extends CategoryLink>(
  items: ReadonlyArray<T>,
): CategoryOptionRow<T>[] {
  const rows: CategoryOptionRow<T>[] = [];
  const byId = new Map(items.map((item) => [item.id, item]));

  function walk(nodes: CategoryTreeNode<T>[], depth: number): void {
    for (const node of nodes) {
      const item = byId.get(node.id);
      if (!item) continue;
      rows.push({ item, depth });
      walk(node.children, depth + 1);
    }
  }

  walk(buildCategoryTree(items), 0);
  return rows;
}

/**
 * Among selected category ids, keeps only the most specific ones —
 * drops any id that is an ancestor of another selected id.
 * Used so PDP related products match the product's leaf category, not its parent.
 */
export function pickMostSpecificCategoryIds(
  selectedIds: ReadonlyArray<string>,
  items: ReadonlyArray<CategoryLink>,
): string[] {
  const selected = [...new Set(selectedIds)];
  if (selected.length <= 1) return selected;

  return selected.filter((id) => {
    const descendants = collectDescendantIds(id, items);
    return !selected.some((other) => other !== id && descendants.has(other));
  });
}

/** Direct and nested descendant ids of a category. */
export function collectDescendantIds(
  categoryId: string,
  items: ReadonlyArray<CategoryLink>,
): Set<string> {
  const grouped = new Map<string, string[]>();
  for (const item of items) {
    if (!item.parentId) continue;
    const siblings = grouped.get(item.parentId) ?? [];
    siblings.push(item.id);
    grouped.set(item.parentId, siblings);
  }

  const ids = new Set<string>();
  const stack = [...(grouped.get(categoryId) ?? [])];
  while (stack.length > 0) {
    const id = stack.pop();
    if (!id || ids.has(id)) continue;
    ids.add(id);
    stack.push(...(grouped.get(id) ?? []));
  }
  return ids;
}

/** True when parent is self or a descendant (would create a cycle). */
export function isInvalidCategoryParent(
  categoryId: string,
  parentId: string | null,
  items: ReadonlyArray<CategoryLink>,
): boolean {
  if (!parentId) return false;
  if (parentId === categoryId) return true;
  return collectDescendantIds(categoryId, items).has(parentId);
}

/** Keeps matching nodes and the ancestors needed to show them. */
export function filterCategoryTree<T extends CategoryLink>(
  nodes: ReadonlyArray<CategoryTreeNode<T>>,
  matches: (node: CategoryTreeNode<T>) => boolean,
): CategoryTreeNode<T>[] {
  const next: CategoryTreeNode<T>[] = [];
  for (const node of nodes) {
    const children = filterCategoryTree(node.children, matches);
    if (matches(node) || children.length > 0) {
      next.push({ ...node, children });
    }
  }
  return next;
}

/** Ids that should stay expanded so a filtered node remains visible. */
export function collectExpandableIds<T extends CategoryLink>(
  nodes: ReadonlyArray<CategoryTreeNode<T>>,
): Set<string> {
  const ids = new Set<string>();
  for (const node of nodes) {
    if (node.children.length === 0) continue;
    ids.add(node.id);
    for (const childId of collectExpandableIds(node.children)) {
      ids.add(childId);
    }
  }
  return ids;
}

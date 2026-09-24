import { describe, expect, it } from "vitest";

import {
  buildCategoryTree,
  collectDescendantIds,
  filterCategoryTree,
  flattenCategoryOptions,
  isInvalidCategoryParent,
  pickMostSpecificCategoryIds,
} from "@/features/categories/domain/category-tree";

const furniture = { id: "root", parentId: null };
const sofas = { id: "sofas", parentId: "root" };
const corner = { id: "corner", parentId: "sofas" };
const tables = { id: "tables", parentId: "root" };
const orphan = { id: "orphan", parentId: "missing" };

describe("category tree", () => {
  it("nests several levels and treats missing parents as roots", () => {
    const tree = buildCategoryTree([
      furniture,
      tables,
      sofas,
      corner,
      orphan,
    ]);

    expect(tree.map((node) => node.id)).toEqual(["root", "orphan"]);
    const root = tree[0];
    expect(root?.children.map((node) => node.id)).toEqual(["tables", "sofas"]);
    expect(
      root?.children.find((node) => node.id === "sofas")?.children.map(
        (node) => node.id,
      ),
    ).toEqual(["corner"]);
  });

  it("flattens options with depth for the parent picker", () => {
    const rows = flattenCategoryOptions([furniture, sofas, corner, tables]);
    expect(rows.map((row) => [row.item.id, row.depth])).toEqual([
      ["root", 0],
      ["sofas", 1],
      ["corner", 2],
      ["tables", 1],
    ]);
  });

  it("blocks a parent that is self or a descendant", () => {
    const items = [furniture, sofas, corner, tables];
    expect(isInvalidCategoryParent("sofas", "sofas", items)).toBe(true);
    expect(isInvalidCategoryParent("root", "corner", items)).toBe(true);
    expect(isInvalidCategoryParent("sofas", "tables", items)).toBe(false);
    expect(isInvalidCategoryParent("corner", null, items)).toBe(false);
    expect(collectDescendantIds("root", items)).toEqual(
      new Set(["sofas", "tables", "corner"]),
    );
  });

  it("keeps matching descendants and their ancestors when filtering", () => {
    const tree = buildCategoryTree([
      { ...furniture, title: "Furniture" },
      { ...sofas, title: "Sofas" },
      { ...corner, title: "Corner sofa" },
    ]);
    const filtered = filterCategoryTree(tree, (node) =>
      node.title.toLowerCase().includes("corner"),
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("root");
    expect(filtered[0]?.children[0]?.id).toBe("sofas");
    expect(filtered[0]?.children[0]?.children[0]?.id).toBe("corner");
  });

  it("keeps only the deepest selected categories for related-product matching", () => {
    const items = [furniture, sofas, corner, tables];
    expect(pickMostSpecificCategoryIds(["root", "sofas", "corner"], items)).toEqual([
      "corner",
    ]);
    expect(pickMostSpecificCategoryIds(["root", "tables"], items)).toEqual([
      "tables",
    ]);
    expect(pickMostSpecificCategoryIds(["corner", "tables"], items).sort()).toEqual(
      ["corner", "tables"].sort(),
    );
    expect(pickMostSpecificCategoryIds(["root"], items)).toEqual(["root"]);
  });
});

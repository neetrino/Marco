import { z } from "zod";

export const adminProductsStockFilter = [
  "all",
  "in_stock",
  "out_of_stock",
  "low_stock",
] as const;

export const adminProductsPublishedFilter = [
  "all",
  "published",
  "unpublished",
] as const;

/**
 * Catalog PKs are text: UUIDv7 (admin-created) or imported marco.am CUID ids.
 * Keep aligned with product-drawer entityIdSchema / catalogIdColumn.
 */
const catalogEntityIdSchema = z.string().trim().min(1).max(64);

export const adminProductsFilterSchema = z.object({
  q: z.string().trim().max(100).optional(),
  sku: z.string().trim().max(64).optional(),
  categoryId: catalogEntityIdSchema.optional(),
  stock: z.enum(adminProductsStockFilter).default("all"),
  published: z.enum(adminProductsPublishedFilter).default("all"),
  sort: z
    .enum(["created", "stock", "price", "title"])
    .default("created"),
  dir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).max(500).default(1),
});

export type AdminProductsFilter = z.infer<typeof adminProductsFilterSchema>;

export const productIdsSchema = z.object({
  productIds: z.array(catalogEntityIdSchema).min(1).max(50),
});

export type ProductIdsInput = z.infer<typeof productIdsSchema>;

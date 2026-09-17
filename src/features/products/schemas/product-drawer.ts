import { z } from "zod";

import {
  DEFAULT_PRODUCT_TAG_POSITION,
  HEX_COLOR_PATTERN,
  MAX_PRODUCT_TAGS,
  MAX_TAG_VALUE_LENGTH,
  PRODUCT_SALES_CLASSES,
  PRODUCT_TAG_POSITIONS,
  PRODUCT_TAG_TYPES,
  PRODUCT_WARRANTY_YEARS,
} from "@/features/products/domain/product-presentation";
import { PRODUCT_TYPES } from "@/features/products/domain/product-type";
import {
  MAX_PRODUCT_SPECS,
  MAX_SPEC_TITLE_LENGTH,
  MAX_SPEC_VALUE_LENGTH,
  slugifyProductTitle,
} from "@/features/products/domain/product-specs";
import { VARIANT_DISCOUNT_TYPES } from "@/features/products/domain/variant-discount";

const productTagSchema = z
  .object({
    id: z.string().trim().min(1).max(64),
    type: z.enum(PRODUCT_TAG_TYPES),
    value: z.string().trim().max(MAX_TAG_VALUE_LENGTH),
    color: z
      .union([
        z.string().trim().regex(HEX_COLOR_PATTERN),
        z.literal(""),
        z.null(),
      ])
      .optional()
      .transform((value) => (value ? value.toUpperCase() : null)),
    position: z
      .enum(PRODUCT_TAG_POSITIONS)
      .optional()
      .transform((value) => value ?? DEFAULT_PRODUCT_TAG_POSITION),
  })
  .superRefine((tag, ctx) => {
    if (!tag.value) return;
    if (tag.type !== "PERCENT") return;
    if (!/^\d{1,2}$/.test(tag.value)) {
      ctx.addIssue({
        code: "custom",
        message: "Percent tags must be a whole number from 1 to 99.",
        path: ["value"],
      });
      return;
    }
    const amount = Number(tag.value);
    if (amount < 1 || amount > 99) {
      ctx.addIssue({
        code: "custom",
        message: "Percent tags must be a whole number from 1 to 99.",
        path: ["value"],
      });
    }
  });

/**
 * Entity primary keys from createId() (UUIDv7) or legacy import IDs (CUID).
 * Existence is enforced by relation sync, not format alone.
 */
const entityIdSchema = z.string().trim().min(1).max(64);

const productVariantSchema = z.object({
  id: entityIdSchema.optional(),
  key: z.string().trim().min(1).max(64),
  sku: z.string().trim().min(1).max(120),
  priceAmount: z.number().int().nonnegative(),
  discountType: z.enum(VARIANT_DISCOUNT_TYPES).nullable(),
  discountValue: z.number().int().nonnegative(),
  discountStartsAt: z.coerce.date().nullable(),
  discountEndsAt: z.coerce.date().nullable(),
  compareAtAmount: z.number().int().nonnegative().nullable(),
  attributeValueIds: z.array(entityIdSchema).min(1),
  removeImageId: entityIdSchema.nullable(),
  existingImageId: entityIdSchema.nullable(),
});

export const productUpsertSchema = z
  .object({
    productType: z.enum(PRODUCT_TYPES),
    sku: z.string().trim().min(1).max(120),
    title: z.string().trim().min(1).max(200),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .transform((value) => slugifyProductTitle(value)),
    description: z.string().trim().max(8000).optional(),
    priceAmount: z.number().int().nonnegative(),
    compareAtAmount: z.number().int().nonnegative().nullable(),
    categoryIds: z.array(entityIdSchema),
    brandIds: z.array(entityIdSchema).default([]),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
    salesClass: z.enum(PRODUCT_SALES_CLASSES),
    warrantyYears: z.number().int().refine(
      (value): value is (typeof PRODUCT_WARRANTY_YEARS)[number] =>
        (PRODUCT_WARRANTY_YEARS as readonly number[]).includes(value),
      { message: "Warranty must be 0, 1, 2, or 3 years." },
    ),
    tags: z.array(productTagSchema).max(MAX_PRODUCT_TAGS),
    specifications: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(64).optional(),
          title: z.string().trim().max(MAX_SPEC_TITLE_LENGTH),
          value: z.string().trim().max(MAX_SPEC_VALUE_LENGTH),
        }),
      )
      .max(MAX_PRODUCT_SPECS),
    primaryExistingId: entityIdSchema.nullable(),
    primaryNewIndex: z.number().int().nullable(),
    removeImageIds: z.array(entityIdSchema),
    selectedAttributeIds: z.array(entityIdSchema).default([]),
    /** SIMPLE product attribute value picks (one value per selected attribute). */
    attributeValueIds: z.array(entityIdSchema).default([]),
    variants: z.array(productVariantSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.productType === "SIMPLE") return;

    if (data.variants.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Variable products require at least one variant.",
        path: ["variants"],
      });
      return;
    }

    const skuSet = new Set<string>();
    for (const [index, variant] of data.variants.entries()) {
      const normalizedSku = variant.sku.toLowerCase();
      if (skuSet.has(normalizedSku)) {
        ctx.addIssue({
          code: "custom",
          message: "Variant SKUs must be unique.",
          path: ["variants", index, "sku"],
        });
      }
      skuSet.add(normalizedSku);

      if (
        variant.compareAtAmount != null &&
        variant.compareAtAmount < variant.priceAmount
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Compare-at price must be greater than or equal to price.",
          path: ["variants", index, "compareAtAmount"],
        });
      }
    }
  });

export type ProductUpsertInput = z.infer<typeof productUpsertSchema>;

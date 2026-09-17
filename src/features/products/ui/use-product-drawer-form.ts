import { useState } from "react";

import type {
  AdminCategoryOption,
  AdminProductListItem,
} from "@/features/products/application/list-admin-products";
import {
  createDraftProductTag,
  parseProductTags,
  type ProductSalesClass,
  type ProductTag,
  type ProductWarrantyYears,
} from "@/features/products/domain/product-presentation";
import { discountPercentFromCompareAt } from "@/features/products/domain/product-discount";
import type { ProductType } from "@/features/products/domain/product-type";
import { VARIABLE_PRODUCT_TYPE_DISABLED } from "@/features/products/domain/product-type";
import {
  createDraftProductVariant,
  type ProductVariantDraft,
} from "@/features/products/domain/product-variant-draft";
import {
  createDraftProductSpec,
  slugifyProductTitle,
  type ProductSpecification,
} from "@/features/products/domain/product-specs";
import type { ProductDraftImage } from "@/features/products/ui/ProductDrawerImages";
import type { ProductDrawerTab } from "@/features/products/ui/ProductDrawerTabs";

type DrawerProduct = Pick<
  AdminProductListItem,
  | "id"
  | "sku"
  | "title"
  | "slug"
  | "description"
  | "priceAmount"
  | "compareAtAmount"
  | "stockOnHand"
  | "status"
  | "categoryIds"
  | "brandIds"
  | "images"
  | "salesClass"
  | "warrantyYears"
  | "tags"
  | "specifications"
  | "productType"
>;

function imagesFromProduct(product: DrawerProduct | null): ProductDraftImage[] {
  if (!product) return [];
  return product.images.map((image) => ({
    key: image.id,
    previewUrl: image.url,
    isPrimary: image.isPrimary,
    existingId: image.id,
  }));
}

export function useProductDrawerForm(args: {
  product: DrawerProduct | null;
  initialCategories: AdminCategoryOption[];
  initialProductType?: ProductType;
  initialSelectedAttributeIds?: string[];
  initialAttributeValueIds?: Record<string, string>;
  initialVariants?: ProductVariantDraft[];
}) {
  const {
    product,
    initialCategories,
    initialProductType,
    initialSelectedAttributeIds,
    initialAttributeValueIds,
    initialVariants,
  } = args;
  const [tab, setTab] = useState<ProductDrawerTab>("basics");
  const [title, setTitle] = useState(product?.title ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [images, setImages] = useState<ProductDraftImage[]>(() =>
    imagesFromProduct(product),
  );
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>(
    product?.categoryIds ?? [],
  );
  const [brandIds, setBrandIds] = useState<string[]>(product?.brandIds ?? []);
  const [productType, setProductType] = useState<ProductType>(
    initialProductType ?? product?.productType ?? "SIMPLE",
  );
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>(
    initialSelectedAttributeIds ?? [],
  );
  const [attributeValueIds, setAttributeValueIds] = useState<
    Record<string, string>
  >(initialAttributeValueIds ?? {});
  const [variants, setVariants] = useState<ProductVariantDraft[]>(
    initialVariants ?? [],
  );
  const [priceAmount, setPriceAmount] = useState(
    product ? String(product.priceAmount) : "",
  );
  const [discountPercent, setDiscountPercent] = useState(
    product
      ? String(
          discountPercentFromCompareAt(
            product.priceAmount,
            product.compareAtAmount,
          ),
        )
      : "0",
  );
  const [sku, setSku] = useState(product?.sku ?? "");
  const [salesClass, setSalesClass] = useState<ProductSalesClass>(
    product?.salesClass ?? "RETAIL",
  );
  const [warrantyYears, setWarrantyYears] = useState<ProductWarrantyYears>(
    product?.warrantyYears ?? 0,
  );
  const [tags, setTags] = useState<ProductTag[]>(() => {
    const existing = product ? parseProductTags(product.tags) : [];
    return existing.length > 0 ? existing : [createDraftProductTag()];
  });
  const [specifications, setSpecifications] = useState<ProductSpecification[]>(
    () =>
      product && product.specifications.length > 0
        ? product.specifications
        : [createDraftProductSpec()],
  );
  const [slugTouched] = useState(product != null);
  const [error, setError] = useState<string | null>(null);

  function handleProductTypeChange(next: ProductType): void {
    if (next === "VARIABLE" && VARIABLE_PRODUCT_TYPE_DISABLED) {
      return;
    }
    setProductType(next);
    if (next === "VARIABLE" && variants.length === 0) {
      setVariants([createDraftProductVariant()]);
    }
  }

  function handleSelectedAttributeIdsChange(nextIds: string[]): void {
    setSelectedAttributeIds(nextIds);
    setAttributeValueIds((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([attributeId]) =>
          nextIds.includes(attributeId),
        ),
      ),
    );
    setVariants((current) =>
      current.map((variant) => {
        const nextAttributeValueIds = Object.fromEntries(
          Object.entries(variant.attributeValueIds).filter(([attributeId]) =>
            nextIds.includes(attributeId),
          ),
        );
        return { ...variant, attributeValueIds: nextAttributeValueIds };
      }),
    );
  }

  function handleImagesChange(next: ProductDraftImage[]): void {
    const nextKeys = new Set(next.map((image) => image.key));
    const removedExisting = images
      .filter(
        (image) =>
          image.existingId &&
          !nextKeys.has(image.key) &&
          !removedImageIds.includes(image.existingId),
      )
      .map((image) => image.existingId as string);
    if (removedExisting.length > 0) {
      setRemovedImageIds((prev) => [...prev, ...removedExisting]);
    }
    setImages(next);
  }

  function handleTitleChange(value: string): void {
    setTitle(value);
  }

  const resolvedSlug = slugifyProductTitle(slugTouched ? slug || title : title);

  return {
    tab,
    setTab,
    title,
    slug: resolvedSlug,
    setSlug,
    description,
    setDescription,
    images,
    removedImageIds,
    categories: initialCategories,
    categoryIds,
    setCategoryIds,
    brandIds,
    setBrandIds,
    productType,
    setProductType,
    handleProductTypeChange,
    selectedAttributeIds,
    setSelectedAttributeIds,
    handleSelectedAttributeIdsChange,
    attributeValueIds,
    setAttributeValueIds,
    variants,
    setVariants,
    priceAmount,
    setPriceAmount,
    discountPercent,
    setDiscountPercent,
    sku,
    setSku,
    salesClass,
    setSalesClass,
    warrantyYears,
    setWarrantyYears,
    tags,
    setTags,
    specifications,
    setSpecifications,
    error,
    setError,
    handleImagesChange,
    handleTitleChange,
  };
}

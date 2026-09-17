import type { AdminCategoryOption } from "@/features/products/application/list-admin-products";
import type { AdminAttributeListItem } from "@/features/attributes/domain/attribute-admin-model";
import { ProductDrawerCatalogTab } from "@/features/products/ui/ProductDrawerCatalogTab";
import {
  ProductDrawerImages,
  type ProductDraftImage,
} from "@/features/products/ui/ProductDrawerImages";
import { ProductDrawerPriceTab } from "@/features/products/ui/ProductDrawerPriceTab";
import type { ProductType } from "@/features/products/domain/product-type";
import type { ProductVariantDraft } from "@/features/products/domain/product-variant-draft";
import type { ProductDrawerTab } from "@/features/products/ui/ProductDrawerTabs";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type EditorCopy = Dictionary["admin"]["productEditor"];

type ProductDrawerRestFieldsProps = {
  tab: ProductDrawerTab;
  copy: EditorCopy;
  attributes: readonly AdminAttributeListItem[];
  productType: ProductType;
  selectedAttributeIds: string[];
  attributeValueIds: Record<string, string>;
  variants: ProductVariantDraft[];
  images: ProductDraftImage[];
  categories: AdminCategoryOption[];
  categoryIds: string[];
  brands: readonly { id: string; title: string }[];
  brandIds: string[];
  priceAmount: string;
  discountPercent: string;
  sku: string;
  disabled: boolean;
  onProductTypeChange: (value: ProductType) => void;
  onSelectedAttributeIdsChange: (ids: string[]) => void;
  onAttributeValueIdsChange: (valueIds: Record<string, string>) => void;
  onVariantsChange: (variants: ProductVariantDraft[]) => void;
  onImagesChange: (images: ProductDraftImage[]) => void;
  onCategoryIdsChange: (ids: string[]) => void;
  onBrandIdsChange: (ids: string[]) => void;
  onPriceAmountChange: (value: string) => void;
  onDiscountPercentChange: (value: string) => void;
  onSkuChange: (value: string) => void;
  tooManyImagesLabel: string;
};

export function ProductDrawerRestFields({
  tab,
  copy,
  attributes,
  productType,
  selectedAttributeIds,
  attributeValueIds,
  variants,
  images,
  categories,
  categoryIds,
  brands,
  brandIds,
  priceAmount,
  discountPercent,
  sku,
  disabled,
  onProductTypeChange,
  onSelectedAttributeIdsChange,
  onAttributeValueIdsChange,
  onVariantsChange,
  onImagesChange,
  onCategoryIdsChange,
  onBrandIdsChange,
  onPriceAmountChange,
  onDiscountPercentChange,
  onSkuChange,
  tooManyImagesLabel,
}: ProductDrawerRestFieldsProps) {
  return (
    <>
      <div hidden={tab !== "media"} data-drawer-tab="media">
        <ProductDrawerImages
          images={images}
          disabled={disabled}
          onChange={onImagesChange}
          tooManyImagesLabel={tooManyImagesLabel}
        />
      </div>

      <div hidden={tab !== "catalog"} data-drawer-tab="catalog">
        <ProductDrawerCatalogTab
          copy={copy}
          categories={categories}
          categoryIds={categoryIds}
          brands={brands}
          brandIds={brandIds}
          disabled={disabled}
          onCategoryIdsChange={onCategoryIdsChange}
          onBrandIdsChange={onBrandIdsChange}
        />
      </div>

      <div hidden={tab !== "price"} data-drawer-tab="price">
        <ProductDrawerPriceTab
          copy={copy}
          productType={productType}
          attributes={attributes}
          selectedAttributeIds={selectedAttributeIds}
          attributeValueIds={attributeValueIds}
          variants={variants}
          priceAmount={priceAmount}
          discountPercent={discountPercent}
          sku={sku}
          disabled={disabled}
          onProductTypeChange={onProductTypeChange}
          onSelectedAttributeIdsChange={onSelectedAttributeIdsChange}
          onAttributeValueIdsChange={onAttributeValueIdsChange}
          onVariantsChange={onVariantsChange}
          onPriceAmountChange={onPriceAmountChange}
          onDiscountPercentChange={onDiscountPercentChange}
          onSkuChange={onSkuChange}
        />
      </div>
    </>
  );
}

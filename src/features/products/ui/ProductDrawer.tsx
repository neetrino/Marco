"use client";

import {
  useEffect,
  useState,
  useTransition,
  type FormEvent,
  type InvalidEvent,
} from "react";
import { useRouter } from "next/navigation";

import { SideSheet } from "@/components/ui/SideSheet";
import type { AdminAttributeListItem } from "@/features/attributes/domain/attribute-admin-model";
import { loadProductDrawerVariantStateAction } from "@/features/products/application/load-product-drawer-state";
import type {
  AdminCategoryOption,
  AdminProductListItem,
} from "@/features/products/application/list-admin-products";
import {
  createProductFromDrawerAction,
  updateProductFromDrawerAction,
} from "@/features/products/application/upsert-product";
import { attachProductGalleryImages } from "@/features/products/ui/attach-product-gallery-images";
import { parseProductTags } from "@/features/products/domain/product-presentation";
import { compareAtFromDiscountPercent } from "@/features/products/domain/product-discount";
import {
  parseProductSpecs,
  slugifyProductTitle,
} from "@/features/products/domain/product-specs";
import type { ProductVariantDraft } from "@/features/products/domain/product-variant-draft";
import { ProductDrawerBasicsTab } from "@/features/products/ui/ProductDrawerBasicsTab";
import { ProductDrawerDescriptionTab } from "@/features/products/ui/ProductDrawerDescriptionTab";
import { ProductDrawerHeader } from "@/features/products/ui/ProductDrawerHeader";
import { ProductDrawerRestFields } from "@/features/products/ui/ProductDrawerRestFields";
import {
  ProductDrawerTabs,
  type ProductDrawerTab,
} from "@/features/products/ui/ProductDrawerTabs";
import { useProductDrawerForm } from "@/features/products/ui/use-product-drawer-form";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/get-dictionary";

type ProductDrawerProduct = Pick<
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

type ProductDrawerProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  product?: ProductDrawerProduct | null;
  categories: AdminCategoryOption[];
  brands: readonly { id: string; title: string }[];
  attributes: readonly AdminAttributeListItem[];
};

function tabFromInvalidTarget(target: EventTarget | null): ProductDrawerTab | null {
  if (!(target instanceof HTMLElement)) return null;
  const tab = target.closest("[data-drawer-tab]")?.getAttribute("data-drawer-tab");
  if (
    tab === "basics" ||
    tab === "description" ||
    tab === "media" ||
    tab === "catalog" ||
    tab === "price"
  ) {
    return tab;
  }
  return null;
}

function buildVariantPayload(variant: ProductVariantDraft) {
  return {
    id: variant.id,
    key: variant.key,
    sku: variant.sku.trim(),
    priceAmount: Number(variant.priceAmount),
    discountType: variant.discountValue === "0" || !variant.discountValue.trim()
      ? null
      : variant.discountType,
    discountValue: Number(variant.discountValue),
    discountStartsAt: null,
    discountEndsAt: variant.discountEndsAt
      ? new Date(variant.discountEndsAt)
      : null,
    compareAtAmount: null,
    attributeValueIds: Object.values(variant.attributeValueIds).filter(Boolean),
    removeImageId: variant.removeImageId,
    existingImageId: variant.image?.existingId ?? null,
  };
}

export function ProductDrawer({
  locale,
  open,
  onClose,
  product = null,
  categories,
  brands,
  attributes,
}: ProductDrawerProps) {
  const copy = isLocale(locale)
    ? getDictionary(locale).admin.productEditor
    : getDictionary("hy").admin.productEditor;
  const productId = product?.id ?? null;
  const loadKey = !open ? "closed" : productId == null ? "new" : productId;
  const [variantState, setVariantState] = useState<{
    productType: ProductDrawerProduct["productType"];
    selectedAttributeIds: string[];
    attributeValueIds: Record<string, string>;
    variants: ProductVariantDraft[];
  } | null>(null);
  const [variantStateReady, setVariantStateReady] = useState(loadKey !== productId);
  const [activeLoadKey, setActiveLoadKey] = useState(loadKey);

  // Reset local drawer state when open/product identity changes (no side effects).
  if (loadKey !== activeLoadKey) {
    setActiveLoadKey(loadKey);
    setVariantState(null);
    setVariantStateReady(loadKey !== productId);
  }

  useEffect(() => {
    if (loadKey === "closed" || loadKey === "new" || productId == null) {
      return;
    }

    let cancelled = false;
    void loadProductDrawerVariantStateAction(locale, productId).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setVariantState(result.value);
      }
      setVariantStateReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [loadKey, locale, productId]);

  const formKey = open
    ? `${productId ?? "new"}-${variantStateReady ? "ready" : "loading"}`
    : "closed";

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      ariaLabel={copy.title}
      panelClassName="w-[min(100%,80vw)]"
    >
      {variantStateReady ? (
        <ProductDrawerForm
          key={formKey}
          locale={locale}
          product={product}
          categories={categories}
          brands={brands}
          attributes={attributes}
          variantState={variantState}
          copy={copy}
          onClose={onClose}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-slate-500">
          {copy.saving}
        </div>
      )}
    </SideSheet>
  );
}

function ProductDrawerForm({
  locale,
  product,
  categories: initialCategories,
  brands,
  attributes,
  variantState,
  copy,
  onClose,
}: {
  locale: string;
  product: ProductDrawerProduct | null;
  categories: AdminCategoryOption[];
  brands: readonly { id: string; title: string }[];
  attributes: readonly AdminAttributeListItem[];
  variantState: {
    productType: ProductDrawerProduct["productType"];
    selectedAttributeIds: string[];
    attributeValueIds: Record<string, string>;
    variants: ProductVariantDraft[];
  } | null;
  copy: Dictionary["admin"]["productEditor"];
  onClose: () => void;
}) {
  const router = useRouter();
  const isEdit = product != null;
  const [savedProductId, setSavedProductId] = useState(product?.id ?? null);
  const form = useProductDrawerForm({
    product,
    initialCategories,
    initialProductType: variantState?.productType,
    initialSelectedAttributeIds: variantState?.selectedAttributeIds,
    initialAttributeValueIds: variantState?.attributeValueIds,
    initialVariants: variantState?.variants,
  });
  const [isPending, startTransition] = useTransition();

  function handleInvalid(event: InvalidEvent<HTMLFormElement>): void {
    const nextTab = tabFromInvalidTarget(event.target);
    if (nextTab) form.setTab(nextTab);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (form.productType === "VARIABLE") {
      if (form.selectedAttributeIds.length === 0) {
        form.setError(copy.variableEmptyHint);
        form.setTab("price");
        return;
      }
      if (form.variants.length === 0) {
        form.setError(copy.variableEmptyHint);
        form.setTab("price");
        return;
      }
      for (const variant of form.variants) {
        if (!variant.sku.trim()) {
          form.setError(copy.skuPlaceholder);
          form.setTab("price");
          return;
        }
        const missingAttribute = form.selectedAttributeIds.some(
          (attributeId) => !variant.attributeValueIds[attributeId],
        );
        if (missingAttribute) {
          form.setError(copy.variableValuePlaceholder);
          form.setTab("price");
          return;
        }
      }
    }

    const newImages = form.images.filter((image) => image.file);
    const primaryImage = form.images.find((image) => image.isPrimary);
    const primaryNewIndex = primaryImage?.file
      ? newImages.findIndex((image) => image.key === primaryImage.key)
      : null;

    const slugValue = slugifyProductTitle(form.slug.trim() || form.title);
    const variantPayload =
      form.productType === "VARIABLE"
        ? form.variants.map(buildVariantPayload)
        : [];
    const leadVariant = [...variantPayload].sort(
      (left, right) => left.priceAmount - right.priceAmount,
    )[0];

    const payload = {
      productType: form.productType,
      sku:
        form.productType === "SIMPLE"
          ? form.sku.trim()
          : leadVariant?.sku ?? `V-${slugValue}`,
      title: form.title.trim(),
      slug: slugValue,
      description: form.description,
      specifications: parseProductSpecs(form.specifications),
      priceAmount:
        form.productType === "SIMPLE"
          ? Number(form.priceAmount)
          : (leadVariant?.priceAmount ?? 0),
      compareAtAmount:
        form.productType === "SIMPLE"
          ? compareAtFromDiscountPercent(
              Number(form.priceAmount),
              Number(form.discountPercent),
            )
          : null,
      categoryIds: form.categoryIds,
      brandIds: form.brandIds,
      status: (product?.status === "ACTIVE" || product?.status === "ARCHIVED"
        ? product.status
        : "DRAFT") as "DRAFT" | "ACTIVE" | "ARCHIVED",
      salesClass: form.salesClass,
      warrantyYears: form.warrantyYears,
      tags: parseProductTags(form.tags),
      primaryExistingId: primaryImage?.existingId ?? null,
      primaryNewIndex:
        primaryNewIndex != null && primaryNewIndex >= 0
          ? primaryNewIndex
          : null,
      removeImageIds: form.removedImageIds,
      selectedAttributeIds: form.selectedAttributeIds,
      attributeValueIds:
        form.productType === "SIMPLE"
          ? form.selectedAttributeIds
              .map((attributeId) => form.attributeValueIds[attributeId])
              .filter((valueId): valueId is string => Boolean(valueId))
          : [],
      variants: variantPayload,
    };

    const formData = new FormData();
    formData.set("data", JSON.stringify(payload));
    for (const variant of form.variants) {
      if (variant.image?.file) {
        formData.append("variantImageKeys", variant.key);
        formData.append("variantImages", variant.image.file);
      }
    }

    startTransition(async () => {
      form.setError(null);
      try {
        const result =
          savedProductId != null
            ? await updateProductFromDrawerAction(
                locale,
                savedProductId,
                formData,
              )
            : await createProductFromDrawerAction(locale, formData);
        if (!result.ok) {
          form.setError(result.error.message);
          return;
        }

        setSavedProductId(result.value.id);
        const mediaResult = await attachProductGalleryImages(
          locale,
          result.value.id,
          form.images,
        );
        if (mediaResult.uploadedKeys.length > 0) {
          const uploaded = new Set(mediaResult.uploadedKeys);
          form.handleImagesChange(
            form.images.map((image) =>
              uploaded.has(image.key) && image.file
                ? { ...image, file: undefined }
                : image,
            ),
          );
        }
        if (mediaResult.error) {
          form.setError(mediaResult.error);
          return;
        }

        onClose();
        router.refresh();
      } catch {
        form.setError(copy.saveFailed);
      }
    });
  }

  const submitLabel = isPending
    ? isEdit
      ? copy.saving
      : copy.creating
    : isEdit
      ? copy.saveProduct
      : copy.addProduct;

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={handleSubmit}
      onInvalid={handleInvalid}
    >
        <ProductDrawerHeader
          editorLabel={copy.title}
          title={form.title}
          titlePlaceholder={copy.titlePlaceholder}
          slug={form.slug}
          slugPlaceholder={copy.slugPlaceholder}
          cancelLabel={copy.cancel}
          submitLabel={submitLabel}
          disabled={isPending}
          onTitleChange={form.handleTitleChange}
          onCancel={onClose}
        />

        <div className="flex min-h-0 flex-1">
          <ProductDrawerTabs
            active={form.tab}
            onChange={form.setTab}
            labels={{
              basics: copy.tabBasics,
              description: copy.tabDescription,
              media: copy.tabMedia,
              catalog: copy.tabCatalog,
              price: copy.tabPrice,
            }}
          />

          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 px-6 py-6">
            <div hidden={form.tab !== "basics"} data-drawer-tab="basics">
              <ProductDrawerBasicsTab
                salesClass={form.salesClass}
                warrantyYears={form.warrantyYears}
                tags={form.tags}
                disabled={isPending}
                copy={copy}
                onSalesClassChange={form.setSalesClass}
                onWarrantyYearsChange={form.setWarrantyYears}
                onTagsChange={form.setTags}
              />
            </div>

            <div hidden={form.tab !== "description"} data-drawer-tab="description">
              <ProductDrawerDescriptionTab
                description={form.description}
                specifications={form.specifications}
                disabled={isPending}
                copy={copy}
                onDescriptionChange={form.setDescription}
                onSpecificationsChange={form.setSpecifications}
              />
            </div>

            <ProductDrawerRestFields
              tab={form.tab}
              copy={copy}
              attributes={attributes}
              productType={form.productType}
              selectedAttributeIds={form.selectedAttributeIds}
              attributeValueIds={form.attributeValueIds}
              variants={form.variants}
              images={form.images}
              categories={form.categories}
              categoryIds={form.categoryIds}
              brands={brands}
              brandIds={form.brandIds}
              priceAmount={form.priceAmount}
              discountPercent={form.discountPercent}
              sku={form.sku}
              disabled={isPending}
              onProductTypeChange={form.handleProductTypeChange}
              onSelectedAttributeIdsChange={form.handleSelectedAttributeIdsChange}
              onAttributeValueIdsChange={form.setAttributeValueIds}
              onVariantsChange={form.setVariants}
              onImagesChange={form.handleImagesChange}
              tooManyImagesLabel={copy.tooManyImages}
              onCategoryIdsChange={form.setCategoryIds}
              onBrandIdsChange={form.setBrandIds}
              onPriceAmountChange={form.setPriceAmount}
              onDiscountPercentChange={form.setDiscountPercent}
              onSkuChange={form.setSku}
            />

            {form.error ? (
              <p className="mt-4 text-sm text-red-700">{form.error}</p>
            ) : null}
          </div>
        </div>
      </form>
    );
}

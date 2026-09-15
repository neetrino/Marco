"use client";

import { ADMIN_INPUT, ADMIN_LABEL } from "@/features/admin/ui/admin-form-classes";
import { CategoryDrawerImageField } from "@/features/categories/ui/CategoryDrawerImageField";
import { localeLabels, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type CategoriesCopy = Dictionary["admin"]["categories"];

type CategoryDrawerMediaFieldsProps = {
  copy: CategoriesCopy;
  showBanner: boolean;
  activeLocale: Locale;
  drawerTitle: string;
  imagePreview: string | null;
  bannerPreview: string | null;
  imageRemovable: boolean;
  disabled: boolean;
  onDrawerTitleChange: (value: string) => void;
  onImageFileChange: (file: File | null) => void;
  onImageRemove: () => void;
  onBannerFileChange: (file: File | null) => void;
  onBannerRemove: () => void;
};

export function CategoryDrawerMediaFields({
  copy,
  showBanner,
  activeLocale,
  drawerTitle,
  imagePreview,
  bannerPreview,
  imageRemovable,
  disabled,
  onDrawerTitleChange,
  onImageFileChange,
  onImageRemove,
  onBannerFileChange,
  onBannerRemove,
}: CategoryDrawerMediaFieldsProps) {
  return (
    <>
      <CategoryDrawerImageField
        label={copy.image}
        uploadLabel={copy.uploadImage}
        changeLabel={copy.changeImage}
        removeLabel={copy.removeImage}
        imagePreview={imagePreview}
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        canRemove={imageRemovable}
        disabled={disabled}
        previewClassName="mt-3 h-16 w-16 rounded-xl border border-gray-200 bg-gray-50 object-contain p-2"
        onFileChange={onImageFileChange}
        onRemove={onImageRemove}
      />
      {showBanner ? (
        <>
          <label className="block">
            <span className={ADMIN_LABEL}>
              {copy.drawerTitleLabel} ({localeLabels[activeLocale]})
            </span>
            <input
              value={drawerTitle}
              onChange={(event) => onDrawerTitleChange(event.target.value)}
              placeholder={copy.drawerTitlePlaceholder}
              className={ADMIN_INPUT}
              disabled={disabled}
            />
          </label>
          <CategoryDrawerImageField
            label={copy.bannerImage}
            uploadLabel={copy.uploadBannerImage}
            changeLabel={copy.changeBannerImage}
            removeLabel={copy.removeBannerImage}
            imagePreview={bannerPreview}
            disabled={disabled}
            previewClassName="mt-3 h-28 w-48 rounded-xl border border-gray-200 object-cover"
            onFileChange={onBannerFileChange}
            onRemove={onBannerRemove}
          />
        </>
      ) : null}
    </>
  );
}

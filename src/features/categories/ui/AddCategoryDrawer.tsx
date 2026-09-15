"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { SelectDropdown } from "@/components/ui/SelectDropdown";
import { SideSheet } from "@/components/ui/SideSheet";
import {
  ADMIN_INPUT,
  ADMIN_LABEL,
} from "@/features/admin/ui/admin-form-classes";
import {
  createCategoryFromDrawerAction,
  updateCategoryFromDrawerAction,
} from "@/features/categories/actions";
import type { AdminCategoryListItem } from "@/features/categories/application/list-admin-categories";
import {
  mergeCategoryTranslations,
  translationsFromDrafts,
} from "@/features/categories/domain/category-translations";
import { CategoryDrawerMediaFields } from "@/features/categories/ui/CategoryDrawerMediaFields";
import { CategoryLocaleTabs } from "@/features/categories/ui/CategoryLocaleTabs";
import { CategoryParentField } from "@/features/categories/ui/CategoryParentField";
import { resolveAdminCategoryIconUrl } from "@/features/categories/domain/header-category-icon";
import {
  draftsFromCategory,
  emptyCategoryDrafts,
  sharedCategorySlug,
  withDraftDrawerTitle,
  withDraftSlug,
  withDraftTitle,
} from "@/features/categories/ui/category-drawer-drafts";
import { defaultLocale, isLocale, localeLabels, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type CategoriesCopy = Dictionary["admin"]["categories"];

type AddCategoryDrawerProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  categories: AdminCategoryListItem[];
  copy: CategoriesCopy;
  category?: AdminCategoryListItem | null;
  requireParent?: boolean;
  defaultParentId?: string;
};

function mapDrawerError(
  copy: CategoriesCopy,
  error: { code: string; message: string },
): string {
  if (error.code === "SLUG_TAKEN") return copy.slugTaken;
  return error.message;
}

function previewFromFile(current: string | null, file: File | null): string | null {
  if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
  return file ? URL.createObjectURL(file) : null;
}

export function AddCategoryDrawer({
  locale,
  open,
  onClose,
  categories,
  copy,
  category = null,
  requireParent = false,
  defaultParentId = "",
}: AddCategoryDrawerProps) {
  const router = useRouter();
  const isEdit = category != null;
  const showParent = isEdit || requireParent;
  const [activeLocale, setActiveLocale] = useState<Locale>(
    isLocale(locale) ? locale : defaultLocale,
  );
  const [drafts, setDrafts] = useState(emptyCategoryDrafts);
  const [slugTouched, setSlugTouched] = useState(false);
  const [parentId, setParentId] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [removeExistingBanner, setRemoveExistingBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevCategory, setPrevCategory] = useState(category);
  const [prevParent, setPrevParent] = useState(defaultParentId);

  if (
    open !== prevOpen ||
    category !== prevCategory ||
    defaultParentId !== prevParent
  ) {
    setPrevOpen(open);
    setPrevCategory(category);
    setPrevParent(defaultParentId);
    if (open) {
      setActiveLocale(isLocale(locale) ? locale : defaultLocale);
      setDrafts(draftsFromCategory(category));
      setSlugTouched(false);
      setParentId(category?.parentId ?? defaultParentId);
      setStatus(category?.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE");
      setImageFile(null);
      setImagePreview(null);
      setRemoveExistingImage(false);
      setBannerFile(null);
      setBannerPreview(category?.bannerImageUrl ?? null);
      setRemoveExistingBanner(false);
      setError(null);
    }
  }

  const draft = drafts[activeLocale];
  const sharedSlug = sharedCategorySlug(drafts);
  const uploadedIconUrl =
    removeExistingImage || imageFile ? null : (category?.imageUrl ?? null);
  const iconPreview = imageFile
    ? imagePreview
    : resolveAdminCategoryIconUrl(
        isEdit && category ? category.slug : sharedSlug,
        isEdit && category ? category.title : draft.title,
        uploadedIconUrl,
      );
  const imageRemovable =
    imageFile != null || Boolean(category?.imageUrl && !removeExistingImage);
  const sheetTitle = isEdit
    ? copy.drawerEdit
    : requireParent
      ? copy.drawerAddSubcategory
      : copy.drawerAddCategory;

  function submitDrawer(): void {
    const translations =
      isEdit && category
        ? mergeCategoryTranslations(category.translations, drafts)
        : translationsFromDrafts(drafts);
    if (!translations || Object.keys(translations).length === 0) return;
    if (requireParent && !parentId) {
      setError(copy.parentRequired);
      return;
    }

    const formData = new FormData();
    formData.set("translations", JSON.stringify(translations));
    formData.set("parentId", parentId);
    formData.set("status", status);
    if (imageFile) formData.set("image", imageFile);
    if (removeExistingImage) formData.set("removeImage", "1");
    if (bannerFile) formData.set("bannerImage", bannerFile);
    if (removeExistingBanner) formData.set("removeBannerImage", "1");

    startTransition(async () => {
      setError(null);
      const result =
        isEdit && category
          ? await updateCategoryFromDrawerAction(locale, category.id, formData)
          : await createCategoryFromDrawerAction(locale, formData);
      if (!result.ok) {
        setError(mapDrawerError(copy, result.error));
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      ariaLabel={sheetTitle}
      panelClassName="w-full max-w-lg"
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-gray-900">{sheetTitle}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          {copy.close}
        </button>
      </div>

      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          submitDrawer();
        }}
      >
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <CategoryLocaleTabs
            value={activeLocale}
            disabled={isPending}
            ariaLabel={copy.localeGroup}
            onChange={setActiveLocale}
          />

          <label className="block">
            <span className={ADMIN_LABEL}>
              {copy.nameLabel} ({localeLabels[activeLocale]}){" "}
              <span className="text-red-600">*</span>
            </span>
            <input
              required
              value={draft.title}
              onChange={(event) =>
                setDrafts((current) =>
                  withDraftTitle(
                    current,
                    activeLocale,
                    event.target.value,
                    isEdit || slugTouched,
                  ),
                )
              }
              placeholder={copy.namePlaceholder}
              className={ADMIN_INPUT}
              disabled={isPending}
            />
          </label>

          <label className="block">
            <span className={ADMIN_LABEL}>
              {copy.slugLabel}{" "}
              <span className="text-red-600">*</span>
            </span>
            <input
              required
              value={sharedSlug}
              onChange={(event) => {
                setSlugTouched(true);
                setDrafts((current) =>
                  withDraftSlug(current, event.target.value),
                );
              }}
              placeholder={copy.slugPlaceholder}
              className={ADMIN_INPUT}
              disabled={isPending}
            />
          </label>

          {showParent ? (
            <CategoryParentField
              copy={copy}
              categories={categories}
              excludeId={category?.id}
              value={parentId}
              disabled={isPending}
              required={requireParent && !isEdit}
              onChange={setParentId}
            />
          ) : null}

          {isEdit ? (
            <div>
              <span className={ADMIN_LABEL}>{copy.status}</span>
              <SelectDropdown
                ariaLabel={copy.status}
                value={status}
                options={[
                  { label: copy.statusActive, value: "ACTIVE" },
                  { label: copy.statusArchived, value: "ARCHIVED" },
                ]}
                disabled={isPending}
                deferChange={false}
                className="mt-1"
                onValueChange={(next) => {
                  if (next === "ACTIVE" || next === "ARCHIVED") {
                    setStatus(next);
                  }
                }}
              />
            </div>
          ) : null}

          <CategoryDrawerMediaFields
            copy={copy}
            showBanner={!parentId}
            activeLocale={activeLocale}
            drawerTitle={draft.drawerTitle}
            imagePreview={iconPreview}
            bannerPreview={bannerPreview}
            imageRemovable={imageRemovable}
            disabled={isPending}
            onDrawerTitleChange={(value) =>
              setDrafts((current) =>
                withDraftDrawerTitle(current, activeLocale, value),
              )
            }
            onImageFileChange={(file) => {
              setImagePreview((current) => previewFromFile(current, file));
              setImageFile(file);
              setRemoveExistingImage(false);
            }}
            onImageRemove={() => {
              setImageFile(null);
              setImagePreview((current) => previewFromFile(current, null));
              if (isEdit && category?.imageUrl) setRemoveExistingImage(true);
            }}
            onBannerFileChange={(file) => {
              setBannerPreview((current) => previewFromFile(current, file));
              setBannerFile(file);
              setRemoveExistingBanner(false);
            }}
            onBannerRemove={() => {
              setBannerFile(null);
              setBannerPreview((current) => previewFromFile(current, null));
              if (isEdit && category?.bannerImageUrl) {
                setRemoveExistingBanner(true);
              }
            }}
          />

          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </div>

        <div className="flex items-center gap-4 border-t border-gray-200 px-5 py-4">
          <button
            type="submit"
            disabled={isPending || !draft.title.trim() || !sharedSlug.trim()}
            className="rounded-full bg-marco-yellow px-5 py-2.5 text-sm font-semibold text-marco-slate transition-[filter] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending
              ? isEdit
                ? copy.saving
                : copy.creating
              : isEdit
                ? copy.submitSave
                : copy.submitCreate}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="whitespace-nowrap text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            {copy.cancel}
          </button>
        </div>
      </form>
    </SideSheet>
  );
}

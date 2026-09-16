"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { SideSheet } from "@/components/ui/SideSheet";
import {
  ADMIN_INPUT,
  ADMIN_LABEL,
} from "@/features/admin/ui/admin-form-classes";
import {
  createBrandFromDrawerAction,
  updateBrandFromDrawerAction,
} from "@/features/brands/actions";
import type { AdminBrandListItem } from "@/features/brands/application/list-admin-brands";
import { generateBrandSku } from "@/features/brands/domain/brand-identity";
import { validateImageFile } from "@/lib/media/image-file";

type AddBrandDrawerProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  brand?: AdminBrandListItem | null;
};

export function AddBrandDrawer({
  locale,
  open,
  onClose,
  brand = null,
}: AddBrandDrawerProps) {
  const router = useRouter();
  const isEdit = brand != null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevBrand, setPrevBrand] = useState(brand);

  if (open !== prevOpen || brand !== prevBrand) {
    setPrevOpen(open);
    setPrevBrand(brand);
    if (open) {
      setTitle(brand?.title ?? "");
      setImageFile(null);
      setImagePreview(brand?.imageUrl ?? null);
      setRemoveExistingImage(false);
      setError(null);
    }
  }

  const sku = isEdit && brand ? brand.sku : generateBrandSku(title);

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      ariaLabel={isEdit ? "Edit brand" : "Add new brand"}
      panelClassName="w-1/2 min-w-[20rem] max-w-full"
    >
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {isEdit ? "Edit brand" : "Add new brand"}
        </h2>
      </div>

      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData();
          formData.set("title", title.trim());
          if (imageFile) formData.set("image", imageFile);
          if (removeExistingImage) formData.set("removeImage", "1");

          startTransition(async () => {
            setError(null);
            const result =
              isEdit && brand
                ? await updateBrandFromDrawerAction(locale, brand.id, formData)
                : await createBrandFromDrawerAction(locale, formData);

            if (!result.ok) {
              setError(result.error.message);
              return;
            }

            onClose();
            router.refresh();
          });
        }}
      >
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <label className="block">
            <span className={ADMIN_LABEL}>
              Title <span className="text-red-600">*</span>
            </span>
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter brand title"
              className={ADMIN_INPUT}
              disabled={isPending}
            />
          </label>

          <div>
            <span className={ADMIN_LABEL}>Image</span>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center rounded-xl border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50"
              >
                {imagePreview ? "Change Image" : "+ Upload Image"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={isPending}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  event.target.value = "";
                  if (file) {
                    const validationError = validateImageFile(file);
                    if (validationError) {
                      setError(validationError);
                      return;
                    }
                  }
                  setError(null);
                  setImagePreview((current) => {
                    if (current?.startsWith("blob:")) {
                      URL.revokeObjectURL(current);
                    }
                    return file ? URL.createObjectURL(file) : null;
                  });
                  setImageFile(file);
                  setRemoveExistingImage(false);
                }}
              />
              {imagePreview ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview((current) => {
                      if (current?.startsWith("blob:")) {
                        URL.revokeObjectURL(current);
                      }
                      return null;
                    });
                    if (isEdit && brand?.imageUrl) {
                      setRemoveExistingImage(true);
                    }
                  }}
                  className="text-sm font-medium text-gray-600 hover:text-red-600"
                >
                  Remove
                </button>
              ) : null}
            </div>
            {imagePreview ? (
              <Image
                src={imagePreview}
                alt=""
                width={112}
                height={112}
                className="mt-3 h-28 w-28 rounded-xl border border-gray-200 object-cover"
                unoptimized={imagePreview.startsWith("blob:")}
              />
            ) : null}
          </div>

          <label className="block">
            <span className={ADMIN_LABEL}>SKU</span>
            <input
              value={title.trim() ? sku : ""}
              placeholder="Generated automatically"
              className={ADMIN_INPUT}
              disabled
              readOnly
            />
            <span className="mt-1 block text-xs text-gray-500">
              Generated automatically from the title.
            </span>
          </label>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </div>

        <div className="flex items-center gap-4 border-t border-gray-200 px-5 py-4">
          <Button type="submit" disabled={isPending || !title.trim()}>
            {isPending
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
                ? "Save"
                : "Create brand"}
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="whitespace-nowrap text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      </form>
    </SideSheet>
  );
}

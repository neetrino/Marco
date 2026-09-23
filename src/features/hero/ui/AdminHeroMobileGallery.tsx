"use client";

import Image from "next/image";
import { useRef } from "react";

import type { AdminHeroMobileImage } from "@/features/hero/application/queries";
import { MAX_HERO_MOBILE_IMAGES } from "@/features/hero/domain/hero-mobile-limits";
import {
  HERO_MOBILE_PREVIEW_CLASS,
  HERO_MOBILE_RADIUS_CLASS,
} from "@/features/hero/ui/hero-banner-classes";

type AdminHeroMobileGalleryProps = {
  label: string;
  hint: string;
  images: AdminHeroMobileImage[];
  fallbackUrl: string | null;
  maxImages?: number;
  disabled: boolean;
  uploading: boolean;
  onAdd: (file: File) => void;
  onRemove: (mediaId: string) => void;
  onMove: (mediaId: string, direction: -1 | 1) => void;
  addLabel: string;
  removeLabel: string;
  moveEarlierLabel: string;
  moveLaterLabel: string;
  maxReachedLabel: string;
};

/** Admin multi-image uploader for the mobile home-hero carousel. */
export function AdminHeroMobileGallery({
  label,
  hint,
  images,
  fallbackUrl,
  maxImages = MAX_HERO_MOBILE_IMAGES,
  disabled,
  uploading,
  onAdd,
  onRemove,
  onMove,
  addLabel,
  removeLabel,
  moveEarlierLabel,
  moveLaterLabel,
  maxReachedLabel,
}: AdminHeroMobileGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = images[0]?.url ?? fallbackUrl;
  const canAdd = images.length < maxImages;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
        <p className="mt-0.5 text-xs text-gray-500">{hint}</p>
      </div>

      <div
        className={`relative w-full overflow-hidden bg-neutral-950 ${HERO_MOBILE_PREVIEW_CLASS} ${HERO_MOBILE_RADIUS_CLASS}`}
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt=""
            fill
            className="object-cover object-center"
            sizes="(max-width: 448px) 100vw, 448px"
            unoptimized={previewUrl.startsWith("blob:")}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/60">
            No mobile images yet
          </div>
        )}
        {uploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-amber-400" />
            <span className="text-sm font-medium text-white">Saving…</span>
          </div>
        ) : null}
      </div>

      <ul className="flex flex-wrap gap-2">
        {images.map((image, index) => (
          <li
            key={image.id}
            className="relative h-20 w-20 overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
          >
            <Image
              src={image.url}
              alt=""
              fill
              className="object-cover"
              sizes="80px"
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-0.5 bg-black/55 p-0.5">
              <button
                type="button"
                disabled={disabled || uploading || index === 0}
                aria-label={moveEarlierLabel}
                onClick={() => onMove(image.id, -1)}
                className="rounded px-1 text-[10px] font-bold text-white disabled:opacity-30"
              >
                ←
              </button>
              <button
                type="button"
                disabled={disabled || uploading}
                aria-label={removeLabel}
                onClick={() => onRemove(image.id)}
                className="rounded px-1 text-[10px] font-bold text-red-200 disabled:opacity-30"
              >
                ×
              </button>
              <button
                type="button"
                disabled={disabled || uploading || index === images.length - 1}
                aria-label={moveLaterLabel}
                onClick={() => onMove(image.id, 1)}
                className="rounded px-1 text-[10px] font-bold text-white disabled:opacity-30"
              >
                →
              </button>
            </div>
          </li>
        ))}

        {canAdd ? (
          <li>
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => inputRef.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 text-xs font-medium text-gray-600 hover:border-amber-300 hover:bg-amber-50/50 disabled:opacity-50"
            >
              +
              <span className="mt-0.5 px-1 text-center leading-tight">
                {addLabel}
              </span>
            </button>
          </li>
        ) : (
          <li className="flex h-20 max-w-[7rem] items-center rounded-xl border border-gray-100 bg-gray-50 px-2 text-[11px] leading-snug text-gray-500">
            {maxReachedLabel}
          </li>
        )}
      </ul>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        disabled={disabled || uploading || !canAdd}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onAdd(file);
        }}
      />
    </div>
  );
}

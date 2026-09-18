"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { useEffect, useState } from "react";

import type { ProductTag } from "@/db/schema";
import type { ProductGalleryImage } from "@/features/products/types";
import { ProductCardTags } from "@/features/products/ui/ProductCardMeta";
import { ProductGalleryLightbox } from "@/features/products/ui/ProductGalleryLightbox";
import {
  GalleryDesktopThumbs,
  GalleryMobileThumbs,
} from "@/features/products/ui/ProductGalleryThumbs";
import { PDP_THUMBNAILS_PER_VIEW } from "@/features/products/ui/product-pdp.constants";

type GalleryLabels = {
  fullscreenImage: string;
  previousImage: string;
  nextImage: string;
  closeLightbox: string;
};

type ProductGalleryProps = {
  images: ProductGalleryImage[];
  title: string;
  tags: readonly ProductTag[];
  discountPercent?: number | null;
  labels: GalleryLabels;
};

export function ProductGallery({
  images,
  title,
  tags,
  discountPercent = null,
  labels,
}: ProductGalleryProps) {
  const [selectedId, setSelectedId] = useState(images[0]?.id ?? null);
  const [thumbStart, setThumbStart] = useState(0);
  const [showZoom, setShowZoom] = useState(false);
  const selectedIndex = Math.max(
    0,
    images.findIndex((image) => image.id === selectedId),
  );
  const selected = images[selectedIndex] ?? images[0] ?? null;
  const hasMultiple = images.length > 1;

  useEffect(() => {
    if (images.length <= PDP_THUMBNAILS_PER_VIEW) return;
    if (selectedIndex < thumbStart) {
      setThumbStart(selectedIndex);
    } else if (selectedIndex >= thumbStart + PDP_THUMBNAILS_PER_VIEW) {
      setThumbStart(selectedIndex - PDP_THUMBNAILS_PER_VIEW + 1);
    }
  }, [selectedIndex, images.length, thumbStart]);

  function selectIndex(index: number): void {
    const image = images[index];
    if (!image) return;
    setSelectedId(image.id);
  }

  function step(delta: number): void {
    if (!hasMultiple) return;
    const next = (selectedIndex + delta + images.length) % images.length;
    selectIndex(next);
  }

  const visibleThumbs = images.slice(
    thumbStart,
    thumbStart + PDP_THUMBNAILS_PER_VIEW,
  );

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
        {hasMultiple ? (
          <GalleryDesktopThumbs
            images={visibleThumbs}
            selectedId={selected?.id ?? null}
            title={title}
            onSelect={setSelectedId}
          />
        ) : null}
        <div className="mx-auto w-full max-w-[420px] md:mx-0 md:max-w-none md:flex-1">
          <GalleryMain
            selected={selected}
            title={title}
            tags={tags}
            discountPercent={discountPercent}
            hasMultiple={hasMultiple}
            labels={labels}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
            onZoom={() => {
              if (selected) setShowZoom(true);
            }}
          />
        </div>
        <GalleryMobileThumbs
          images={images}
          selectedId={selected?.id ?? null}
          title={title}
          onSelect={setSelectedId}
        />
      </div>
      {showZoom && selected ? (
        <ProductGalleryLightbox
          src={selected.url}
          alt={selected.alt || title}
          closeLabel={labels.closeLightbox}
          onClose={() => setShowZoom(false)}
        />
      ) : null}
    </>
  );
}

function GalleryMain({
  selected,
  title,
  tags,
  discountPercent,
  hasMultiple,
  labels,
  onPrev,
  onNext,
  onZoom,
}: {
  selected: ProductGalleryImage | null;
  title: string;
  tags: readonly ProductTag[];
  discountPercent: number | null;
  hasMultiple: boolean;
  labels: GalleryLabels;
  onPrev: () => void;
  onNext: () => void;
  onZoom: () => void;
}) {
  return (
    <div
      className="group relative aspect-square overflow-hidden rounded-lg bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
      data-product-detail-fly-source
      data-cart-fly-source
    >
      {selected ? (
        <Image
          src={selected.url}
          alt={selected.alt || title}
          fill
          sizes="(max-width: 768px) 100vw, 420px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
          —
        </div>
      )}
      <GalleryChrome
        tags={tags}
        discountPercent={discountPercent}
        showZoom={Boolean(selected)}
        hasMultiple={hasMultiple}
        labels={labels}
        onPrev={onPrev}
        onNext={onNext}
        onZoom={onZoom}
      />
    </div>
  );
}

function GalleryChrome({
  tags,
  discountPercent,
  showZoom,
  hasMultiple,
  labels,
  onPrev,
  onNext,
  onZoom,
}: {
  tags: readonly ProductTag[];
  discountPercent: number | null;
  showZoom: boolean;
  hasMultiple: boolean;
  labels: GalleryLabels;
  onPrev: () => void;
  onNext: () => void;
  onZoom: () => void;
}) {
  return (
    <>
      {discountPercent != null ? (
        <div className="absolute top-4 right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-marco-yellow text-sm font-bold text-marco-black shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
          -{discountPercent}%
        </div>
      ) : null}
      <ProductCardTags
        tags={tags}
        topRightClassName={discountPercent != null ? "top-20" : undefined}
      />
      {showZoom ? (
        <button
          type="button"
          onClick={onZoom}
          className="absolute bottom-4 left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.15)] backdrop-blur-sm transition hover:bg-white/90"
          aria-label={labels.fullscreenImage}
        >
          <Maximize2 className="h-5 w-5 text-gray-800" aria-hidden />
        </button>
      ) : null}
      {hasMultiple ? (
        <>
          <GalleryHoverNav
            side="left"
            label={labels.previousImage}
            onClick={onPrev}
          />
          <GalleryHoverNav
            side="right"
            label={labels.nextImage}
            onClick={onNext}
          />
        </>
      ) : null}
    </>
  );
}

function GalleryHoverNav({
  side,
  label,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  const position = side === "left" ? "left-2 sm:left-4" : "right-2 sm:right-4";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute ${position} top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 touch-manipulation items-center justify-center rounded-full bg-white/85 text-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.18)] backdrop-blur-sm transition hover:bg-white md:pointer-events-none md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100`}
    >
      <Icon className="h-5 w-5" strokeWidth={2.5} aria-hidden />
    </button>
  );
}

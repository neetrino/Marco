"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import type { ProductGalleryImage } from "@/features/products/types";
import { useIsClient } from "@/lib/react/use-is-client";

const SWIPE_THRESHOLD_PX = 48;

type LightboxLabels = {
  previousImage: string;
  nextImage: string;
  closeLightbox: string;
};

type ProductGalleryLightboxProps = {
  images: ProductGalleryImage[];
  index: number;
  title: string;
  labels: LightboxLabels;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

export function ProductGalleryLightbox({
  images,
  index,
  title,
  labels,
  onIndexChange,
  onClose,
}: ProductGalleryLightboxProps) {
  const mounted = useIsClient();
  const selected = images[index] ?? images[0] ?? null;
  const hasMultiple = images.length > 1;

  useEffect(() => {
    function onKey(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
      if (!hasMultiple) return;
      if (event.key === "ArrowLeft") stepIndex(images.length, index, -1, onIndexChange);
      if (event.key === "ArrowRight") stepIndex(images.length, index, 1, onIndexChange);
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [hasMultiple, images.length, index, onClose, onIndexChange]);

  if (!mounted || !selected) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label={selected.alt || title}
    >
      <LightboxStage
        image={selected}
        title={title}
        enabled={hasMultiple}
        onStep={(delta) => stepIndex(images.length, index, delta, onIndexChange)}
        onClose={onClose}
      />
      <button
        type="button"
        className="absolute top-4 right-4 z-20 text-white"
        aria-label={labels.closeLightbox}
        onClick={onClose}
      >
        <X className="h-7 w-7" aria-hidden />
      </button>
      {hasMultiple ? (
        <>
          <LightboxNav
            side="left"
            label={labels.previousImage}
            onClick={() => stepIndex(images.length, index, -1, onIndexChange)}
          />
          <LightboxNav
            side="right"
            label={labels.nextImage}
            onClick={() => stepIndex(images.length, index, 1, onIndexChange)}
          />
        </>
      ) : null}
    </div>,
    document.body,
  );
}

function LightboxStage({
  image,
  title,
  enabled,
  onStep,
  onClose,
}: {
  image: ProductGalleryImage;
  title: string;
  enabled: boolean;
  onStep: (delta: number) => void;
  onClose: () => void;
}) {
  const startRef = useRef<{ x: number; y: number } | null>(null);

  return (
    <div
      className="relative z-10 h-full w-full touch-pan-y"
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        startRef.current = { x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerUp={(event) => {
        const start = startRef.current;
        startRef.current = null;
        if (!start) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (enabled && Math.abs(dx) >= SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) {
          onStep(dx < 0 ? 1 : -1);
          return;
        }
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) onClose();
      }}
      onPointerCancel={() => {
        startRef.current = null;
      }}
    >
      <Image
        src={image.url}
        alt={image.alt || title}
        fill
        className="pointer-events-none object-contain"
        sizes="100vw"
        draggable={false}
      />
    </div>
  );
}

function LightboxNav({
  side,
  label,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  const position = side === "left" ? "left-3 sm:left-6" : "right-3 sm:right-6";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute ${position} top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-lg`}
    >
      <Icon className="h-5 w-5" strokeWidth={2.5} aria-hidden />
    </button>
  );
}

function stepIndex(
  length: number,
  index: number,
  delta: number,
  onIndexChange: (index: number) => void,
): void {
  if (length < 2) return;
  onIndexChange((index + delta + length) % length);
}

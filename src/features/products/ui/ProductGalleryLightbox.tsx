"use client";

import Image from "next/image";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { useIsClient } from "@/lib/react/use-is-client";

type ProductGalleryLightboxProps = {
  src: string;
  alt: string;
  closeLabel: string;
  onClose: () => void;
};

export function ProductGalleryLightbox({
  src,
  alt,
  closeLabel,
  onClose,
}: ProductGalleryLightboxProps) {
  const mounted = useIsClient();

  useEffect(() => {
    function onKey(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <div className="relative h-full w-full max-h-full max-w-full">
        <Image
          src={src}
          alt=""
          fill
          className="object-contain"
          sizes="100vw"
        />
      </div>
      <button
        type="button"
        className="absolute top-4 right-4 text-white"
        aria-label={closeLabel}
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
      >
        <X className="h-7 w-7" aria-hidden />
      </button>
    </div>,
    document.body,
  );
}

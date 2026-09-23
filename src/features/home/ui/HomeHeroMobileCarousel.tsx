"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  HOME_HERO_MOBILE_AUTO_ROTATE_MS,
  HOME_HERO_MOBILE_USER_PAUSE_MS,
} from "@/features/home/ui/home-section.constants";

type HomeHeroMobileCarouselProps = {
  images: readonly string[];
};

const MOBILE_HERO_IMAGE_SIZES =
  "(max-width: 640px) calc(100vw - 2rem), (max-width: 768px) calc(100vw - 3rem), 0px";

/** Mobile-only home hero slider: swipe, dots, auto-advance when more than one slide. */
export function HomeHeroMobileCarousel({ images }: HomeHeroMobileCarouselProps) {
  const slides = images.filter((src) => src.length > 0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const pauseUntilRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const syncIndexFromScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || slides.length === 0) return;
    const width = el.clientWidth;
    if (width === 0) return;
    const next = Math.round(el.scrollLeft / width);
    setActiveIndex(Math.max(0, Math.min(slides.length - 1, next)));
  }, [slides.length]);

  const goToIndex = useCallback((index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }, []);

  const markUserInteraction = useCallback(() => {
    pauseUntilRef.current = Date.now() + HOME_HERO_MOBILE_USER_PAUSE_MS;
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", syncIndexFromScroll, { passive: true });
    return () => el.removeEventListener("scroll", syncIndexFromScroll);
  }, [syncIndexFromScroll]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const intervalId = window.setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return;
      const el = scrollerRef.current;
      if (!el || el.clientWidth === 0) return;
      const current = Math.round(el.scrollLeft / el.clientWidth);
      const next = current >= slides.length - 1 ? 0 : current + 1;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, HOME_HERO_MOBILE_AUTO_ROTATE_MS);
    return () => window.clearInterval(intervalId);
  }, [slides.length]);

  if (slides.length === 0) {
    return <div className="absolute inset-0 z-0 bg-neutral-800 md:hidden" />;
  }

  if (slides.length === 1) {
    const src = slides[0];
    if (!src) {
      return <div className="absolute inset-0 z-0 bg-neutral-800 md:hidden" />;
    }
    return (
      <div className="absolute inset-0 z-0 md:hidden">
        <Image
          src={src}
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes={MOBILE_HERO_IMAGE_SIZES}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0 md:hidden">
      <div
        ref={scrollerRef}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onTouchStart={markUserInteraction}
        onPointerDown={markUserInteraction}
        aria-roledescription="carousel"
      >
        {slides.map((src, index) => (
          <div
            key={`${src}-${index}`}
            className="relative h-full w-full shrink-0 snap-center"
            aria-hidden={index !== activeIndex}
          >
            <Image
              src={src}
              alt=""
              fill
              priority={index === 0}
              className="object-cover object-center"
              sizes={MOBILE_HERO_IMAGE_SIZES}
            />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`${index + 1}`}
            aria-current={index === activeIndex ? "true" : undefined}
            className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full"
            onClick={() => {
              markUserInteraction();
              goToIndex(index);
            }}
          >
            <span
              className={`h-2 w-2 rounded-full ${index === activeIndex ? "bg-white" : "bg-white/45"}`}
              aria-hidden
            />
          </button>
        ))}
      </div>
    </div>
  );
}

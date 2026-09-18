"use client";

import { useState } from "react";

import { incrementReelViewAction } from "@/features/reels/application/manage-reels";
import type { StorefrontReel } from "@/features/reels/application/queries";
import { reelThumbnailSrc } from "@/features/reels/domain/reel-rules";
import { ReelFeedViewer } from "@/features/reels/ui/ReelFeedViewer";
import { chunkItems } from "@/features/home/paginate";
import { HomePaginationDots } from "@/features/home/ui/HomePaginationDots";
import { HomeSectionHeading } from "@/features/home/ui/HomeSectionHeading";
import { HOME_PAGE_SHELL_CLASS } from "@/features/home/ui/home-section-classes";
import {
  HOME_RAIL_TO_DOTS_GAP_PX,
  HOME_REELS_MOBILE_RAIL_BLEED_LEFT_PX,
  HOME_REELS_MOBILE_TILE_BASIS_CSS,
  HOME_REELS_TITLE_TO_RAIL_GAP_PX,
} from "@/features/home/ui/home-section.constants";
import { useIsMaxMd } from "@/features/home/ui/use-is-max-md";
import { useSnapCarousel } from "@/features/home/ui/use-snap-carousel";

const REELS_MOBILE_PAGE_SIZE = 3;
const REELS_DESKTOP_PAGE_SIZE = 6;

type HomeReelsProps = {
  title: string;
  playLabel: string;
  closeLabel: string;
  muteLabel: string;
  unmuteLabel: string;
  previousPageLabel: string;
  nextPageLabel: string;
  paginationLabel: string;
  reels: StorefrontReel[];
};

export function HomeReels({
  title,
  playLabel,
  closeLabel,
  muteLabel,
  unmuteLabel,
  previousPageLabel,
  nextPageLabel,
  paginationLabel,
  reels,
}: HomeReelsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const isMaxMd = useIsMaxMd();
  const mobile = useSnapCarousel(
    Math.max(chunkItems(reels, REELS_MOBILE_PAGE_SIZE).length, 1),
  );
  const desktop = useSnapCarousel(
    Math.max(chunkItems(reels, REELS_DESKTOP_PAGE_SIZE).length, 1),
  );
  const carousel = isMaxMd ? mobile : desktop;

  if (reels.length === 0) return null;

  return (
    <section
      data-home-reels=""
      className="mt-4 bg-white py-8 sm:mt-6 sm:py-10 md:mt-8"
      aria-labelledby="home-reels-heading"
    >
      <div className={HOME_PAGE_SHELL_CLASS}>
        <div style={{ marginBottom: HOME_REELS_TITLE_TO_RAIL_GAP_PX }}>
          <HomeSectionHeading
            id="home-reels-heading"
            title={title}
            prevLabel={previousPageLabel}
            nextLabel={nextPageLabel}
            onPrev={() => carousel.scrollToPage(carousel.activePage - 1)}
            onNext={() => carousel.scrollToPage(carousel.activePage + 1)}
            canScrollPrev={carousel.canScrollPrev}
            canScrollNext={carousel.canScrollNext}
            accent="full"
            titleInsetClassName="md:pl-10"
          />
        </div>
        <div className="md:hidden">
          <HomeReelsPagedRail
            pages={chunkItems(reels, REELS_MOBILE_PAGE_SIZE)}
            playLabel={playLabel}
            scrollerRef={mobile.scrollerRef}
            onScroll={mobile.onScroll}
            onOpen={(reel) => setActiveId(reel.id)}
          />
        </div>
        <div className="hidden md:block">
          <HomeReelsPagedRail
            pages={chunkItems(reels, REELS_DESKTOP_PAGE_SIZE)}
            playLabel={playLabel}
            scrollerRef={desktop.scrollerRef}
            onScroll={desktop.onScroll}
            onOpen={(reel) => setActiveId(reel.id)}
          />
        </div>
        <div style={{ marginTop: HOME_RAIL_TO_DOTS_GAP_PX }}>
          <HomePaginationDots
            pageCount={
              isMaxMd
                ? chunkItems(reels, REELS_MOBILE_PAGE_SIZE).length
                : chunkItems(reels, REELS_DESKTOP_PAGE_SIZE).length
            }
            activePage={carousel.activePage}
            label={paginationLabel}
            onGoToPage={carousel.scrollToPage}
          />
        </div>
      </div>
      {activeId ? (
        <ReelFeedViewer
          reels={reels}
          initialReelId={activeId}
          closeLabel={closeLabel}
          muteLabel={muteLabel}
          unmuteLabel={unmuteLabel}
          onClose={() => setActiveId(null)}
          onActiveChange={(reelId) => {
            void incrementReelViewAction({ reelId });
          }}
        />
      ) : null}
    </section>
  );
}

type HomeReelsPagedRailProps = {
  pages: StorefrontReel[][];
  playLabel: string;
  scrollerRef: ReturnType<typeof useSnapCarousel>["scrollerRef"];
  onScroll: () => void;
  onOpen: (reel: StorefrontReel) => void;
};

function HomeReelsPagedRail({
  pages,
  playLabel,
  scrollerRef,
  onScroll,
  onOpen,
}: HomeReelsPagedRailProps) {
  return (
    <div
      ref={scrollerRef}
      onScroll={onScroll}
      className="flex min-w-0 overflow-x-auto pt-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] max-md:-ml-[var(--reels-mobile-rail-bleed)] [&::-webkit-scrollbar]:hidden"
      style={{
        scrollSnapType: "x mandatory",
        ["--reels-mobile-tile-basis" as string]: HOME_REELS_MOBILE_TILE_BASIS_CSS,
        ["--reels-mobile-rail-bleed" as string]: `${HOME_REELS_MOBILE_RAIL_BLEED_LEFT_PX}px`,
      }}
    >
      {pages.map((page, pageIndex) => (
        <div
          key={`reels-page-${pageIndex}`}
          className="flex min-w-full shrink-0 snap-start justify-start gap-2 md:gap-11 md:pl-10"
        >
          {page.map((reel) => (
            <HomeReelTile
              key={reel.id}
              reel={reel}
              playLabel={playLabel}
              onOpen={onOpen}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function HomeReelTile({
  reel,
  playLabel,
  onOpen,
}: {
  reel: StorefrontReel;
  playLabel: string;
  onOpen: (reel: StorefrontReel) => void;
}) {
  const title = reel.title.trim();
  const ariaLabel = title ? `${playLabel}: ${title}` : playLabel;

  return (
    <button
      type="button"
      onClick={() => onOpen(reel)}
      className="group flex min-w-0 shrink-0 flex-col items-center transition-transform duration-200 hover:-translate-y-0.5 max-md:flex-[0_0_var(--reels-mobile-tile-basis)] md:min-w-[148px]"
      aria-label={ariaLabel}
    >
      <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-full border border-gray-200 bg-marco-gray shadow-[0_6px_16px_rgba(0,0,0,0.08)] transition-shadow group-hover:shadow-[0_12px_26px_rgba(0,0,0,0.18)] md:h-32 md:w-32">
        <video
          src={reelThumbnailSrc(reel.videoUrl)}
          className="absolute inset-0 h-full w-full object-cover object-center transition duration-300 group-hover:scale-105"
          muted
          playsInline
          preload="metadata"
          tabIndex={-1}
        />
      </div>
    </button>
  );
}

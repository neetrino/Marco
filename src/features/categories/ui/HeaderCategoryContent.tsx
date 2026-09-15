"use client";

import { useEffect, useRef } from "react";

import { AppLink } from "@/components/ui/AppLink";
import {
  headerCategoryGroups,
  type HeaderCategoryNode,
} from "@/features/categories/domain/header-category-menu";
import { hasHeaderCategoryPromo } from "@/features/categories/domain/header-category-promo";
import { HeaderCategoryGroups } from "@/features/categories/ui/HeaderCategoryGroups";
import { HeaderCategoryPromoBanner } from "@/features/categories/ui/HeaderCategoryPromoBanner";
import { HEADER_CATEGORY_CONTENT_PADDING_CLASS } from "@/features/categories/ui/header-category-menu.classes";

type HeaderCategoryContentProps = {
  selected: HeaderCategoryNode;
  hrefFor: (slug: string) => string;
  seeAllLabel: string;
  onNavigate: () => void;
};

export function HeaderCategoryContent({
  selected,
  hrefFor,
  seeAllLabel,
  onNavigate,
}: HeaderCategoryContentProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const headingId = `header-mega-subcats-${selected.id}`;
  const groups = headerCategoryGroups(selected);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [selected.id]);

  return (
    <div
      ref={scrollRef}
      className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain bg-white pt-4 pb-6 md:pt-5 md:pb-8 ${HEADER_CATEGORY_CONTENT_PADDING_CLASS}`}
    >
      {hasHeaderCategoryPromo(selected.drawerTitle, selected.bannerImageUrl) ? (
        <div className="w-full shrink-0">
          <HeaderCategoryPromoBanner
            bannerImageUrl={selected.bannerImageUrl}
            drawerTitle={selected.drawerTitle}
          />
        </div>
      ) : null}
      <div className="flex w-full min-w-0 flex-col gap-6 md:gap-8">
        <div className="w-full shrink-0 pt-1">
          <div className="flex flex-wrap items-center gap-2.5 md:gap-3">
            <h2
              id={headingId}
              className="text-[20px] font-bold tracking-[-0.02em] text-marco-slate uppercase leading-tight md:text-[26px] md:leading-[1.1] lg:text-[32px] lg:leading-[37px]"
            >
              <AppLink
                href={hrefFor(selected.slug)}
                prefetchPolicy="none"
                onClick={onNavigate}
                className="hover:opacity-90"
              >
                {selected.title}
              </AppLink>
            </h2>
            {selected.count > 0 ? (
              <span className="inline-flex shrink-0 items-center rounded-full bg-marco-yellow px-2.5 py-0.5 text-sm font-bold text-marco-slate tabular-nums">
                {selected.count}
              </span>
            ) : null}
          </div>
          <div className="mt-2 h-[5px] w-[104px] shrink-0 bg-marco-yellow" aria-hidden />
        </div>
        <HeaderCategoryGroups
          headingId={headingId}
          groups={groups}
          hrefFor={hrefFor}
          seeAllLabel={seeAllLabel}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}

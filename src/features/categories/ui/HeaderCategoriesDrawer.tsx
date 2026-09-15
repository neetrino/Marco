"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { SideSheet } from "@/components/ui/SideSheet";
import type { HeaderCategoryNode } from "@/features/categories/domain/header-category-menu";
import { HeaderCategoryContent } from "@/features/categories/ui/HeaderCategoryContent";
import { HeaderCategoryRail } from "@/features/categories/ui/HeaderCategoryRail";
import {
  HEADER_CATEGORY_CLOSE_CLASS,
  HEADER_CATEGORY_PANEL_WIDTH_CLASS,
  HEADER_CATEGORY_SURFACE_CLASS,
} from "@/features/categories/ui/header-category-menu.classes";
import { resolveHeaderCategoryPromo } from "@/features/categories/domain/header-category-promo";
import { catalogHref } from "@/features/products/domain/catalog-href";
import { EMPTY_CATALOG_SEARCH } from "@/features/products/domain/catalog-search-params";
import type { Locale } from "@/lib/i18n/config";

export type HeaderCategoryCopy = {
  categories: string;
  close: string;
  seeAll: string;
};

type HeaderCategoriesDrawerProps = {
  locale: Locale;
  categories: readonly HeaderCategoryNode[];
  copy: HeaderCategoryCopy;
  triggerClassName: string;
};

export function HeaderCategoriesDrawer({
  locale,
  categories,
  copy,
  triggerClassName,
}: HeaderCategoriesDrawerProps) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(categories[0]?.id ?? "");
  const selected =
    categories.find((category) => category.id === selectedId) ?? categories[0];

  useEffect(() => {
    const firstCategory = categories[0];
    if (!firstCategory) {
      setSelectedId("");
      return;
    }

    const hasSelected = categories.some((category) => category.id === selectedId);
    if (!hasSelected) {
      setSelectedId(firstCategory.id);
    }
  }, [categories, selectedId]);

  function hrefFor(slug: string): string {
    const rootIsHardware =
      selected != null &&
      resolveHeaderCategoryPromo(selected.slug, selected.title) === "hardware";
    return catalogHref(locale, {
      ...EMPTY_CATALOG_SEARCH,
      categorySlugs: [slug],
      ...(rootIsHardware ? { pricePresence: "without" as const } : {}),
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={triggerClassName}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="min-w-0 flex-1 truncate text-center">
          {copy.categories}
        </span>
        <span
          className={`inline-flex shrink-0 origin-center transition-transform duration-300 ease-out ${
            open ? "rotate-180" : "rotate-0"
          }`}
          aria-hidden
        >
          <ChevronDown className="size-4" strokeWidth={2} />
        </span>
      </button>

      <SideSheet
        open={open}
        onClose={() => setOpen(false)}
        ariaLabel={copy.categories}
        side="left"
        panelClassName={HEADER_CATEGORY_PANEL_WIDTH_CLASS}
        zIndexClassName="z-[200]"
        backdropBlur
        closeAriaLabel={copy.close}
        closeClassName={HEADER_CATEGORY_CLOSE_CLASS}
        surfaceClassName={HEADER_CATEGORY_SURFACE_CLASS}
      >
        {selected ? (
          <div className="flex h-full min-h-0 w-full flex-col py-4 sm:py-5 md:py-6">
            <div className="flex h-full max-h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-white md:flex-row">
              <HeaderCategoryRail
                categories={categories}
                selectedId={selected.id}
                ariaLabel={copy.categories}
                onSelect={setSelectedId}
              />
              <HeaderCategoryContent
                selected={selected}
                hrefFor={hrefFor}
                seeAllLabel={copy.seeAll}
                onNavigate={() => setOpen(false)}
              />
            </div>
          </div>
        ) : null}
      </SideSheet>
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";
import { X } from "lucide-react";

import {
  MOBILE_DRAWER_MENU_HEADER_ROW_CLASS,
  MOBILE_DRAWER_SHEET_CLOSE_BTN_CLASS,
} from "@/components/layout/mobile-nav-drawer.classes";
import { SideSheet } from "@/components/ui/SideSheet";
import { catalogHref } from "@/features/products/domain/catalog-href";
import type { CatalogFacets } from "@/features/products/domain/catalog-filters";
import type { CatalogSearchParams } from "@/features/products/domain/catalog-search-params";
import {
  CatalogFilterPanel,
  type CatalogFilterCopy,
} from "@/features/products/ui/CatalogFilterPanel";
import {
  CatalogListingToolbar,
  type CatalogListingToolbarCopy,
} from "@/features/products/ui/CatalogListingToolbar";
import { CatalogPageTitle } from "@/features/products/ui/CatalogPageTitle";
import { CatalogViewModeProvider } from "@/features/products/ui/CatalogViewModeProvider";
import {
  CATALOG_FILTER_ASIDE,
  CATALOG_LAYOUT,
} from "@/features/products/ui/catalog-filter-classes";
import type { Currency } from "@/lib/money/currency";

type CatalogFilterSidebarProps = {
  locale: string;
  pageTitle: string;
  filters: CatalogSearchParams;
  facets: CatalogFacets;
  priceBounds: { minMajor: number; maxMajor: number } | null;
  currency: Currency;
  copy: CatalogFilterCopy & CatalogListingToolbarCopy;
  children: ReactNode;
};

/** Storefront catalog layout: left filters (drawer on mobile) + product grid. */
export function CatalogFilterSidebar({
  locale,
  pageTitle,
  filters,
  facets,
  priceBounds,
  currency,
  copy,
  children,
}: CatalogFilterSidebarProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const closeFilters = useCallback(() => setOpen(false), []);
  const onFiltersChange = useCallback(
    (next: CatalogSearchParams) => {
      router.push(catalogHref(locale, next));
    },
    [locale, router],
  );

  const panelProps = {
    filters,
    facets,
    priceBounds,
    currency,
    copy,
    onFiltersChange,
  };

  return (
    <CatalogViewModeProvider>
      <div className={CATALOG_LAYOUT}>
        <aside className={CATALOG_FILTER_ASIDE}>
          <div className="mb-4 shrink-0 lg:mb-5 xl:mb-6">
            <CatalogPageTitle title={pageTitle} />
          </div>
          <CatalogFilterPanel {...panelProps} />
        </aside>
        <div className="min-w-0 flex-1">
          <div className="pb-3 min-[744px]:hidden">
            <CatalogPageTitle title={pageTitle} />
          </div>
          <CatalogListingToolbar
            filters={filters}
            copy={copy}
            onFiltersChange={onFiltersChange}
            onOpenFilters={() => setOpen(true)}
          />
          <SideSheet
            open={open}
            onClose={closeFilters}
            ariaLabel={copy.filtersLabel}
            side="left"
            panelClassName="w-full max-w-sm"
            closeVariant="none"
            closeAriaLabel={copy.closeFilters}
          >
            <div className="flex h-full min-h-0 flex-col px-5 pt-4 pb-6">
              <div className={MOBILE_DRAWER_MENU_HEADER_ROW_CLASS}>
                <h2 className="text-base font-bold text-marco-black">
                  {copy.filtersLabel}
                </h2>
                <button
                  type="button"
                  onClick={closeFilters}
                  className={MOBILE_DRAWER_SHEET_CLOSE_BTN_CLASS}
                  aria-label={copy.closeFilters}
                >
                  <X className="h-6 w-6" strokeWidth={2} aria-hidden />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto pt-2">
                <CatalogFilterPanel {...panelProps} />
              </div>
            </div>
          </SideSheet>
          {children}
        </div>
      </div>
    </CatalogViewModeProvider>
  );
}

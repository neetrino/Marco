"use client";

import { ListFilter, Search, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import type { AdminCategoryOption } from "@/features/products/application/list-admin-products";
import {
  adminProductsHref,
  type AdminProductsQueryState,
} from "@/features/products/domain/admin-products-query";
import { AdminProductsFilterPanel } from "@/features/products/ui/AdminProductsFilterPanel";
import {
  adminProductsHasActiveFilters,
  buildAdminProductsFilterChips,
  clearedAdminProductsFilters,
} from "@/features/products/ui/admin-products-filter-chips";
import {
  ADMIN_PRODUCTS_CHIP,
  ADMIN_PRODUCTS_SEARCH_IDLE,
  ADMIN_PRODUCTS_SEARCH_OPEN,
  ADMIN_PRODUCTS_SEARCH_SHELL,
} from "@/features/products/ui/admin-products.classes";
import { formatAdminMessage, getAdminCopy } from "@/features/admin/ui/get-admin-copy";

const SEARCH_DEBOUNCE_MS = 250;

type AdminProductsFiltersProps = {
  locale: string;
  filters: AdminProductsQueryState;
  categories: ReadonlyArray<AdminCategoryOption>;
};

export function AdminProductsFilters({
  locale,
  filters,
  categories,
}: AdminProductsFiltersProps) {
  const copy = getAdminCopy(locale).products;
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const [panelOpen, setPanelOpen] = useState(false);
  const [inputValue, setInputValue] = useState(filters.q ?? "");

  function navigate(next: Partial<AdminProductsQueryState>): void {
    router.push(adminProductsHref(locale, filters, next));
  }

  useEffect(() => {
    if (inputValue === (filters.q ?? "")) return;
    const handle = window.setTimeout(() => {
      router.push(
        adminProductsHref(locale, filters, {
          q: inputValue.trim() || undefined,
          page: 1,
        }),
      );
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [filters, inputValue, locale, router]);

  useEffect(() => {
    if (!panelOpen) return;
    function handlePointerDown(event: MouseEvent): void {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target)) setPanelOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [panelOpen]);

  const chips = buildAdminProductsFilterChips(filters, categories, copy);
  const hasAnythingToClear = adminProductsHasActiveFilters(filters, inputValue);

  return (
    <div ref={rootRef} className="relative z-30 mb-6">
      <div className="relative">
        <div
          className={`${ADMIN_PRODUCTS_SEARCH_SHELL} ${
            panelOpen ? ADMIN_PRODUCTS_SEARCH_OPEN : ADMIN_PRODUCTS_SEARCH_IDLE
          }`}
        >
          <Search
            className="pointer-events-none ml-3 h-4 w-4 shrink-0 text-gray-400 sm:ml-4"
            aria-hidden
          />
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 py-2 pr-2 pl-1">
            {chips.map((chip) => (
              <span key={chip.key} className={ADMIN_PRODUCTS_CHIP}>
                <span className="truncate">{chip.label}</span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(chip.clear);
                  }}
                  className="shrink-0 rounded-full p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-marco-ink"
                  aria-label={formatAdminMessage(copy.removeFilterChip, {
                    label: chip.label,
                  })}
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </span>
            ))}
            <input
              type="search"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onFocus={() => setPanelOpen(true)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                navigate({ q: inputValue.trim() || undefined, page: 1 });
                setPanelOpen(false);
              }}
              placeholder={
                chips.length > 0
                  ? copy.searchWithFiltersPlaceholder
                  : copy.searchTitlePlaceholder
              }
              autoComplete="off"
              aria-label={copy.searchLabel}
              className="min-w-[7rem] flex-1 border-0 bg-transparent py-1 text-sm text-marco-ink placeholder:text-gray-400 focus:ring-0 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (hasAnythingToClear) {
                setInputValue("");
                navigate(clearedAdminProductsFilters());
                return;
              }
              setPanelOpen((open) => !open);
            }}
            className={`relative mr-2 flex shrink-0 items-center justify-center rounded-lg p-2 transition-colors sm:mr-3 ${
              hasAnythingToClear
                ? "bg-red-500 text-white hover:bg-red-600"
                : panelOpen
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-marco-ink"
            }`}
            aria-label={hasAnythingToClear ? copy.clearAll : copy.openFilters}
            aria-expanded={panelOpen}
            aria-controls={panelId}
          >
            {hasAnythingToClear ? (
              <Trash2 className="h-4 w-4" aria-hidden />
            ) : (
              <ListFilter className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
        {panelOpen ? (
          <AdminProductsFilterPanel
            locale={locale}
            panelId={panelId}
            filters={filters}
            categories={categories}
            onChange={navigate}
          />
        ) : null}
      </div>
    </div>
  );
}

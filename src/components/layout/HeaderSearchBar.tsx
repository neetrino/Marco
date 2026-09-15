import { Search } from "lucide-react";
import { Suspense } from "react";

import {
  HEADER_CATEGORIES_PILL_CLASS,
  HEADER_SEARCH_SUBMIT_CLASS,
} from "@/components/layout/site-header-classes";
import { HeaderSearchQueryInput } from "@/components/layout/HeaderSearchQueryInput";
import { AppLink } from "@/components/ui/AppLink";
import { HeaderCategoriesDrawer } from "@/features/categories/ui/HeaderCategoriesDrawer";
import type { HeaderCategoryNode } from "@/features/categories/domain/header-category-menu";
import { CATALOG_SEARCH_QUERY_MAX_LENGTH } from "@/features/products/domain/catalog-text-search";
import type { Locale } from "@/lib/i18n/config";

type HeaderSearchBarProps = {
  locale: Locale;
  categoriesLabel: string;
  closeLabel: string;
  seeAllLabel: string;
  placeholder: string;
  submitLabel: string;
  categories: readonly HeaderCategoryNode[];
};

function HeaderSearchQueryFallback({ placeholder }: { placeholder: string }) {
  return (
    <input
      type="search"
      name="q"
      placeholder={placeholder}
      className="min-w-0 flex-1 bg-transparent px-2 text-xs text-marco-slate outline-none placeholder:text-marco-slate/60"
      aria-label={placeholder}
      autoComplete="off"
      maxLength={CATALOG_SEARCH_QUERY_MAX_LENGTH}
    />
  );
}

export function HeaderSearchBar({
  locale,
  categoriesLabel,
  closeLabel,
  seeAllLabel,
  placeholder,
  submitLabel,
  categories,
}: HeaderSearchBarProps) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-x-[22px]">
      {categories.length > 0 ? (
        <HeaderCategoriesDrawer
          locale={locale}
          categories={categories}
          copy={{
            categories: categoriesLabel,
            close: closeLabel,
            seeAll: seeAllLabel,
          }}
          triggerClassName={HEADER_CATEGORIES_PILL_CLASS}
        />
      ) : (
        <AppLink
          href={`/${locale}/products`}
          prefetchPolicy="intent"
          className={HEADER_CATEGORIES_PILL_CLASS}
        >
          {categoriesLabel}
        </AppLink>
      )}

      <form
        action={`/${locale}/products`}
        method="get"
        className="flex h-10 min-w-0 flex-1 items-center rounded-[89px] bg-marco-gray pr-0 pl-4"
      >
        <Search
          className="h-4 w-4 shrink-0 text-marco-slate"
          aria-hidden
        />
        <Suspense
          fallback={<HeaderSearchQueryFallback placeholder={placeholder} />}
        >
          <HeaderSearchQueryInput placeholder={placeholder} />
        </Suspense>
        <button type="submit" className={HEADER_SEARCH_SUBMIT_CLASS}>
          {submitLabel}
        </button>
      </form>
    </div>
  );
}

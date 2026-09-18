import { Search } from "lucide-react";
import { Suspense } from "react";

import {
  HEADER_CATEGORIES_PILL_CLASS,
  HEADER_SEARCH_SUBMIT_CLASS,
} from "@/components/layout/site-header-classes";
import {
  HeaderSearchField,
  type HeaderSearchFieldCopy,
} from "@/components/layout/HeaderSearchField";
import { AppLink } from "@/components/ui/AppLink";
import { HeaderCategoriesDrawer } from "@/features/categories/ui/HeaderCategoriesDrawer";
import type { HeaderCategoryNode } from "@/features/categories/domain/header-category-menu";
import { CATALOG_SEARCH_QUERY_MAX_LENGTH } from "@/features/products/domain/catalog-text-search";
import { HEADER_SEARCH_INPUT_CLASS } from "@/features/products/ui/header-search-suggestions.classes";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type HeaderSearchBarProps = {
  locale: Locale;
  currency: Currency;
  categoriesLabel: string;
  closeLabel: string;
  seeAllLabel: string;
  searchCopy: HeaderSearchFieldCopy;
  submitLabel: string;
  categories: readonly HeaderCategoryNode[];
};

function HeaderSearchQueryFallback({ placeholder }: { placeholder: string }) {
  return (
    <input
      type="search"
      name="q"
      placeholder={placeholder}
      className={HEADER_SEARCH_INPUT_CLASS}
      aria-label={placeholder}
      autoComplete="off"
      maxLength={CATALOG_SEARCH_QUERY_MAX_LENGTH}
    />
  );
}

export function HeaderSearchBar({
  locale,
  currency,
  categoriesLabel,
  closeLabel,
  seeAllLabel,
  searchCopy,
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
        className="relative min-w-0 flex-1"
      >
        <div className="relative flex h-10 min-w-0 items-center overflow-visible rounded-[89px] bg-marco-gray pr-0 pl-4">
          <Search className="h-4 w-4 shrink-0 text-marco-slate" aria-hidden />
          <Suspense
            fallback={
              <HeaderSearchQueryFallback placeholder={searchCopy.placeholder} />
            }
          >
            <HeaderSearchField
              locale={locale}
              currency={currency}
              copy={searchCopy}
            />
          </Suspense>
          <button type="submit" className={HEADER_SEARCH_SUBMIT_CLASS}>
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

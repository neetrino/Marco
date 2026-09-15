import { AccountControls } from "@/components/layout/AccountControls";
import { HeaderSearchBar } from "@/components/layout/HeaderSearchBar";
import { LocaleCurrencySwitcher } from "@/components/layout/LocaleCurrencySwitcher";
import { SITE_HEADER_INNER } from "@/components/layout/site-header-classes";
import { CartDrawer } from "@/features/cart/ui/CartDrawer";
import type { HeaderCategoryNode } from "@/features/categories/domain/header-category-menu";
import { CompareHeaderLink } from "@/features/compare/ui/CompareHeaderLink";
import { WishlistHeaderLink } from "@/features/wishlist/ui/WishlistHeaderLink";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";
import type { SessionUser } from "@/lib/auth/session";

type SiteHeaderMainNavProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
  user: SessionUser | null;
  cartItemCount: number;
  cartTotalFormatted: string;
  wishlistCount: number;
  compareCount: number;
  categories: readonly HeaderCategoryNode[];
};

export function SiteHeaderMainNav({
  locale,
  currency,
  dictionary,
  user,
  cartItemCount,
  cartTotalFormatted,
  wishlistCount,
  compareCount,
  categories,
}: SiteHeaderMainNavProps) {
  return (
    <header className="relative z-40 border-b border-gray-200 bg-white">
      <div className={SITE_HEADER_INNER}>
        <div className="flex items-center gap-3 py-2 min-[1180px]:gap-5">
          <HeaderSearchBar
            locale={locale}
            categoriesLabel={dictionary.nav.categories}
            closeLabel={dictionary.nav.closeMenu}
            seeAllLabel={dictionary.nav.seeAllSubcategories}
            placeholder={dictionary.header.searchPlaceholder}
            submitLabel={dictionary.header.searchSubmit}
            categories={categories}
          />

          <div className="hidden shrink-0 items-center gap-1 min-[1180px]:flex">
            <LocaleCurrencySwitcher
              locale={locale}
              currency={currency}
              currencyLabel={dictionary.header.currency}
              languageLabel={dictionary.header.language}
            />
            <AccountControls
              locale={locale}
              loginLabel={dictionary.header.login}
              logoutLabel={dictionary.header.logout}
              profileLabel={dictionary.header.profile}
              adminLabel={dictionary.header.admin}
              user={user}
            />
            <CompareHeaderLink
              locale={locale}
              label={dictionary.nav.compare}
              count={compareCount}
            />
            <WishlistHeaderLink
              locale={locale}
              label={dictionary.nav.wishlist}
              count={wishlistCount}
            />
            <CartDrawer
              locale={locale}
              currency={currency}
              dictionary={dictionary}
              itemCount={cartItemCount}
              cartTotalFormatted={cartTotalFormatted}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

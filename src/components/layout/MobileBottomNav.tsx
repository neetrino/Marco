"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import {
  MobileNavCartBoldIcon,
  MobileNavCartLinearIcon,
  MobileNavHomeBoldIcon,
  MobileNavHomeLinearIcon,
  MobileNavProfileBoldIcon,
  MobileNavProfileLinearIcon,
  MobileNavWishlistBagIcon,
  MobileNavWishlistBoldIcon,
  MobileNavWishlistLinearIcon,
} from "@/components/layout/mobile-bottom-nav-icons";
import {
  buildFloorNavItems,
  type FloorNavItem,
  type NavSlot,
} from "@/components/layout/mobile-bottom-nav-items";
import {
  MOBILE_NAV_ACTIVE_FOREGROUND,
  MOBILE_NAV_ACTIVE_PILL_BG,
  MOBILE_NAV_BOX_SHADOW,
  MOBILE_NAV_FAB_CLASS,
  MOBILE_NAV_FAB_FOREGROUND,
  MOBILE_NAV_FAB_SHADOW,
  MOBILE_NAV_INACTIVE_ICON,
  MOBILE_NAV_TOP_CORNER_RADIUS_PX,
} from "@/components/layout/mobile-bottom-nav.constants";
import { subscribeMobileCatalogBrowse } from "@/components/layout/request-mobile-catalog-browse";
import { AppLink } from "@/components/ui/AppLink";
import type { HeaderCategoryNode } from "@/features/categories/domain/header-category-menu";
import {
  MobileCatalogBrowseDrawer,
  mobileCatalogBrowseCopy,
} from "@/features/categories/ui/MobileCatalogBrowseDrawer";
import { CartDrawer } from "@/features/cart/ui/CartDrawer";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type MobileBottomNavProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
  cartItemCount: number;
  isSignedIn: boolean;
  categories: readonly HeaderCategoryNode[];
};

function renderNavIcon(slot: NavSlot, active: boolean, sizeClass: string): ReactNode {
  switch (slot) {
    case "home":
      return active ? (
        <MobileNavHomeBoldIcon className={sizeClass} />
      ) : (
        <MobileNavHomeLinearIcon className={sizeClass} />
      );
    case "shop":
      return <MobileNavWishlistBagIcon className={sizeClass} />;
    case "wishlist":
      return active ? (
        <MobileNavWishlistBoldIcon className={sizeClass} />
      ) : (
        <MobileNavWishlistLinearIcon className={sizeClass} />
      );
    case "cart":
      return active ? (
        <MobileNavCartBoldIcon className={sizeClass} />
      ) : (
        <MobileNavCartLinearIcon className={sizeClass} />
      );
    case "profile":
      return active ? (
        <MobileNavProfileBoldIcon className={sizeClass} />
      ) : (
        <MobileNavProfileLinearIcon className={sizeClass} />
      );
  }
}

function NavBadge({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <span className="pointer-events-none absolute -top-2 -right-2 z-10 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white tabular-nums shadow-sm ring-2 ring-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function SideTabGlyph({
  slot,
  active,
  badgeCount,
}: {
  slot: NavSlot;
  active: boolean;
  badgeCount?: number;
}) {
  const icon = (
    <div
      className="relative flex h-6 w-6 shrink-0 items-center justify-center"
      style={{
        color: active ? MOBILE_NAV_ACTIVE_FOREGROUND : MOBILE_NAV_INACTIVE_ICON,
      }}
    >
      {renderNavIcon(slot, active, "h-6 w-6 shrink-0")}
      {badgeCount != null ? <NavBadge count={badgeCount} /> : null}
    </div>
  );

  if (active) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full px-3 py-2"
        style={{ backgroundColor: MOBILE_NAV_ACTIVE_PILL_BG }}
      >
        {icon}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center py-2">{icon}</span>
  );
}

function SideLinkTab({
  item,
  active,
}: {
  item: FloorNavItem;
  active: boolean;
}) {
  return (
    <AppLink
      href={item.href}
      prefetchPolicy="intent"
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      className="flex min-h-[44px] flex-1 items-center justify-center px-1 py-1"
    >
      <SideTabGlyph slot={item.id} active={active} />
    </AppLink>
  );
}

function CenterShopTab({
  label,
  open,
  onOpen,
}: {
  label: string;
  open: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      aria-expanded={open}
      aria-haspopup="dialog"
      className="flex h-14 w-14 items-center justify-center"
    >
      <span
        className={MOBILE_NAV_FAB_CLASS}
        style={{
          backgroundColor: MOBILE_NAV_ACTIVE_PILL_BG,
          boxShadow: MOBILE_NAV_FAB_SHADOW,
        }}
      >
        <span
          className="relative flex h-7 w-7 shrink-0 items-center justify-center"
          style={{ color: MOBILE_NAV_FAB_FOREGROUND }}
        >
          {renderNavIcon("shop", false, "h-7 w-7 shrink-0")}
        </span>
      </span>
    </button>
  );
}

export function MobileBottomNav({
  locale,
  currency,
  dictionary,
  cartItemCount,
  isSignedIn,
  categories,
}: MobileBottomNavProps) {
  const pathname = usePathname() ?? `/${locale}`;
  const [browseOpen, setBrowseOpen] = useState(false);
  useEffect(() => subscribeMobileCatalogBrowse(() => setBrowseOpen(true)), []);
  const items = buildFloorNavItems(
    locale,
    dictionary,
    isSignedIn ? `/${locale}/profile` : `/${locale}/login`,
  );

  return (
    <>
      <nav
        aria-label={dictionary.nav.navigation}
        data-mobile-bottom-nav
        className="mobile-bottom-nav pointer-events-none fixed inset-x-0 bottom-0 z-50 w-full md:hidden"
      >
        <div className="pointer-events-none mx-auto max-w-md">
          <div
            className="pointer-events-auto overflow-visible bg-white pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]"
            style={{
              borderTopLeftRadius: MOBILE_NAV_TOP_CORNER_RADIUS_PX,
              borderTopRightRadius: MOBILE_NAV_TOP_CORNER_RADIUS_PX,
              boxShadow: MOBILE_NAV_BOX_SHADOW,
            }}
          >
            <div className="relative mx-auto max-w-md px-4 pt-3 pb-2">
              <div className="flex items-center">
                <div className="flex flex-1 items-center justify-between gap-1">
                  <SideLinkTab
                    item={items.home}
                    active={items.home.match(pathname)}
                  />
                  <SideLinkTab
                    item={items.wishlist}
                    active={items.wishlist.match(pathname)}
                  />
                </div>
                <div className="w-14 shrink-0" aria-hidden="true" />
                <div className="flex flex-1 items-center justify-between gap-1">
                  <CartDrawer
                    locale={locale}
                    currency={currency}
                    dictionary={dictionary}
                    itemCount={cartItemCount}
                    renderTrigger={({
                      open,
                      badgeCount,
                      label,
                      openDrawer,
                      prefetchDrawerView,
                    }) => (
                      <button
                        type="button"
                        onClick={openDrawer}
                        onPointerEnter={prefetchDrawerView}
                        onFocus={prefetchDrawerView}
                        aria-label={label}
                        aria-expanded={open}
                        data-cart-fly-target
                        className="flex min-h-[44px] flex-1 items-center justify-center px-1 py-1"
                      >
                        <SideTabGlyph
                          slot="cart"
                          active={open}
                          badgeCount={badgeCount}
                        />
                      </button>
                    )}
                  />
                  <SideLinkTab
                    item={items.profile}
                    active={items.profile.match(pathname)}
                  />
                </div>
              </div>
              <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2">
                <div className="pointer-events-auto">
                  <CenterShopTab
                    label={items.shop.label}
                    open={browseOpen}
                    onOpen={() => setBrowseOpen(true)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <MobileCatalogBrowseDrawer
        open={browseOpen}
        onClose={() => setBrowseOpen(false)}
        locale={locale}
        categories={categories}
        copy={mobileCatalogBrowseCopy(dictionary)}
      />
    </>
  );
}

import {
  Building2,
  Clapperboard,
  LayoutGrid,
  Mail,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

type MobileDrawerNavLink = {
  kind: "link";
  href: string;
  label: string;
  icon: LucideIcon;
};

type MobileDrawerCatalogAction = {
  kind: "catalog";
  label: string;
  icon: LucideIcon;
};

export type MobileDrawerNavItem = MobileDrawerNavLink | MobileDrawerCatalogAction;

/**
 * Drawer entries that are not already on the mobile floor nav (home / shop).
 * Categories opens the same browse sheet as the shop icon.
 */
export function buildMobileDrawerNavItems(
  locale: Locale,
  dictionary: Dictionary,
): MobileDrawerNavItem[] {
  return [
    {
      kind: "catalog",
      label: dictionary.nav.categories,
      icon: LayoutGrid,
    },
    {
      kind: "link",
      href: `/${locale}/brand`,
      label: dictionary.nav.brand,
      icon: Tag,
    },
    {
      kind: "link",
      href: `/${locale}/about`,
      label: dictionary.nav.about,
      icon: Building2,
    },
    {
      kind: "link",
      href: `/${locale}/contact`,
      label: dictionary.nav.contact,
      icon: Mail,
    },
    {
      kind: "link",
      href: `/${locale}/reels`,
      label: dictionary.nav.reels,
      icon: Clapperboard,
    },
  ];
}

export function isMobileDrawerNavActive(
  pathname: string,
  href: string,
  locale: Locale,
): boolean {
  if (href === `/${locale}` || href === `/${locale}/`) {
    return pathname === `/${locale}` || pathname === `/${locale}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

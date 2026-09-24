"use client";

import { ChevronRight, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { MobileNavDrawerCallSection } from "@/components/layout/MobileNavDrawerCallSection";
import { MobileNavDrawerLocaleSwitch } from "@/components/layout/MobileNavDrawerLocaleSwitch";
import { HeaderSocialCircles } from "@/components/layout/HeaderSocialCircles";
import {
  buildMobileDrawerNavItems,
  isMobileDrawerNavActive,
} from "@/components/layout/mobile-nav-drawer-items";
import {
  MOBILE_DRAWER_BACKDROP_CLASS,
  MOBILE_DRAWER_CLOSE_BTN_CLASS,
  MOBILE_DRAWER_FOOTER_CLASS,
  MOBILE_DRAWER_POPUP_BODY_CLASS,
  MOBILE_DRAWER_POPUP_CARD_CLASS,
  MOBILE_DRAWER_POPUP_CLASS,
  MOBILE_DRAWER_POPUP_SHELL_CLASS,
  MOBILE_DRAWER_PROFILE_BTN_CLASS,
  mobileDrawerBackdropStateClass,
  mobileDrawerCloseButtonStateClass,
  mobileDrawerNavLinkClass,
  mobileDrawerPopupStateClass,
} from "@/components/layout/mobile-nav-drawer.classes";
import { requestMobileCatalogBrowse } from "@/components/layout/request-mobile-catalog-browse";
import { AppLink } from "@/components/ui/AppLink";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

type MobileNavDrawerPanelProps = {
  locale: Locale;
  dictionary: Dictionary;
  pathname: string;
  menuId: string;
  entered: boolean;
  onClose: () => void;
};

function DrawerNavRowContent({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <>
      <span className="flex min-w-0 flex-1 items-center gap-3.5">
        <Icon className="h-6 w-6 shrink-0" strokeWidth={2} aria-hidden />
        <span className="truncate">{label}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 opacity-50" aria-hidden />
    </>
  );
}

function MobileDrawerNavList({
  locale,
  dictionary,
  pathname,
  onClose,
}: Omit<MobileNavDrawerPanelProps, "menuId" | "entered">) {
  const items = buildMobileDrawerNavItems(locale, dictionary);

  return (
    <nav className="flex flex-col" aria-label={dictionary.nav.navigation}>
      {items.map((item) => {
        if (item.kind === "catalog") {
          return (
            <button
              key="catalog"
              type="button"
              className={mobileDrawerNavLinkClass(false)}
              onClick={() => {
                onClose();
                requestMobileCatalogBrowse();
              }}
            >
              <DrawerNavRowContent icon={item.icon} label={item.label} />
            </button>
          );
        }

        const active = isMobileDrawerNavActive(pathname, item.href, locale);
        return (
          <AppLink
            key={item.href}
            href={item.href}
            prefetchPolicy="intent"
            aria-current={active ? "page" : undefined}
            className={mobileDrawerNavLinkClass(active)}
            onClick={onClose}
          >
            <DrawerNavRowContent icon={item.icon} label={item.label} />
          </AppLink>
        );
      })}
    </nav>
  );
}

function MobileDrawerSocialRow({ dictionary }: { dictionary: Dictionary }) {
  return (
    <div className="mb-4 flex justify-center">
      <HeaderSocialCircles
        dictionary={dictionary}
        className="justify-center"
        menuPlacement="top"
      />
    </div>
  );
}

function MobileDrawerPopupFooter({
  locale,
  dictionary,
  onClose,
}: {
  locale: Locale;
  dictionary: Dictionary;
  onClose: () => void;
}) {
  return (
    <footer className={MOBILE_DRAWER_FOOTER_CLASS}>
      <MobileDrawerSocialRow dictionary={dictionary} />
      <MobileNavDrawerCallSection
        locale={locale}
        dictionary={dictionary}
        onClose={onClose}
      />
      <div className="flex items-end gap-3">
        <MobileNavDrawerLocaleSwitch
          locale={locale}
          languageLabel={dictionary.header.language}
          onNavigate={onClose}
        />
        <AppLink
          href={`/${locale}/profile`}
          prefetchPolicy="intent"
          className={MOBILE_DRAWER_PROFILE_BTN_CLASS}
          onClick={onClose}
        >
          {dictionary.header.profile}
        </AppLink>
      </div>
    </footer>
  );
}

export function MobileNavDrawerPanel({
  locale,
  dictionary,
  pathname,
  menuId,
  entered,
  onClose,
}: MobileNavDrawerPanelProps) {
  return (
    <div
      id={menuId}
      role="dialog"
      aria-modal="true"
      aria-label={dictionary.nav.navigation}
      className={`fixed inset-0 z-[600] min-[1180px]:hidden ${entered ? "pointer-events-auto" : "pointer-events-none"}`}
    >
      <button
        type="button"
        className={`${MOBILE_DRAWER_BACKDROP_CLASS} ${mobileDrawerBackdropStateClass(entered)}`}
        aria-label={dictionary.nav.closeMenu}
        onClick={onClose}
      />

      <div className={MOBILE_DRAWER_POPUP_SHELL_CLASS}>
        <div className={`${MOBILE_DRAWER_POPUP_CLASS} ${mobileDrawerPopupStateClass(entered)}`}>
          <button
            type="button"
            onClick={onClose}
            className={`${MOBILE_DRAWER_CLOSE_BTN_CLASS} ${mobileDrawerCloseButtonStateClass(entered)}`}
            aria-label={dictionary.nav.closeMenu}
          >
            <X className="h-6 w-6" strokeWidth={2} aria-hidden />
          </button>

          <div className={MOBILE_DRAWER_POPUP_CARD_CLASS}>
            <div className={MOBILE_DRAWER_POPUP_BODY_CLASS}>
              <MobileDrawerNavList
                locale={locale}
                dictionary={dictionary}
                pathname={pathname}
                onClose={onClose}
              />
              <MobileDrawerPopupFooter
                locale={locale}
                dictionary={dictionary}
                onClose={onClose}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

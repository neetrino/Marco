import Image from "next/image";
import { ChevronDown, MapPin } from "lucide-react";

import { FooterPaymentMarks } from "@/components/layout/FooterPaymentMarks";
import { FooterSocialTiles } from "@/components/layout/FooterSocialTiles";
import { AppLink } from "@/components/ui/AppLink";
import {
  buildContactLocations,
  phoneToTelHref,
  type ContactLocation,
} from "@/features/contact/content/contact-locations";
import {
  FOOTER_BRAND_COLUMN_GAP_CLASS,
  FOOTER_BRAND_DESCRIPTION_OVERLAP_CLASS,
  FOOTER_BRAND_DESCRIPTION_TEXT_CLASS,
  FOOTER_BRAND_LOGO_BOX_CLASS,
  FOOTER_BRAND_LOGO_SHIFT_CLASS,
  FOOTER_CONTACT_MAIL_ICON_CLASS,
  FOOTER_CONTACT_ROW_CENTER_CLASS,
  FOOTER_CONTACT_PHONE_ICON_CLASS,
  FOOTER_GRID_COMPANY_SUPPORT_WRAPPER_CLASS,
  FOOTER_GRID_CONTACTS_WRAPPER_CLASS,
  FOOTER_HEADING_CLASS,
  FOOTER_LINK_CLASS,
  FOOTER_MAIN_GRID_CLASS,
  FOOTER_NAV_COLUMN_HEADING_LIST_GAP_CLASS,
  FOOTER_NAV_COLUMN_LIST_ITEM_GAP_CLASS,
  FOOTER_NAV_THREE_COLUMN_ROW_CLASS,
  FOOTER_SURFACE_CLASS,
  FOOTER_TABLET_COLUMN_CENTER_CLASS,
} from "@/components/layout/site-footer.classes";
import {
  FOOTER_CONTACT_MAIL_ICON_SRC,
  FOOTER_CONTACT_PHONE_ICON_SRC,
} from "@/components/layout/site-footer.constants";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

const NEETRINO_STUDIO_HREF = "https://neetrino.com/";
const MARCO_LOGO_SRC = "/logo.webp";

type SiteFooterProps = {
  dictionary: Dictionary;
  locale: Locale;
};

type FooterNavItem = {
  href: string;
  label: string;
};

function FooterNavColumn({
  title,
  items,
}: {
  title: string;
  items: readonly FooterNavItem[];
}) {
  return (
    <div
      className={`flex h-full w-full max-w-full flex-col ${FOOTER_NAV_COLUMN_HEADING_LIST_GAP_CLASS} ${FOOTER_TABLET_COLUMN_CENTER_CLASS}`}
    >
      <p className={FOOTER_HEADING_CLASS}>{title}</p>
      <ul className={`flex flex-col ${FOOTER_NAV_COLUMN_LIST_ITEM_GAP_CLASS}`}>
        {items.map((item) => (
          <li key={`${item.href}-${item.label}`}>
            <AppLink
              href={item.href}
              prefetchPolicy="intent"
              className={FOOTER_LINK_CLASS}
            >
              {item.label}
            </AppLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterLocationContact({ location }: { location: ContactLocation }) {
  return (
    <details className="group">
      <summary
        className={`flex cursor-pointer list-none items-start gap-2 ${FOOTER_CONTACT_ROW_CENTER_CLASS} [&::-webkit-details-marker]:hidden`}
      >
        <MapPin
          className="mt-0 h-[18px] w-[18px] shrink-0 -translate-x-px translate-y-[3px] self-start text-marco-slate"
          strokeWidth={2}
          aria-hidden
        />
        <span className={`${FOOTER_LINK_CLASS} leading-snug`}>{location.address}</span>
        <ChevronDown
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-marco-slate transition-transform group-open:rotate-180"
          strokeWidth={2.25}
          aria-hidden
        />
      </summary>
      <div className={`mt-1 flex items-start gap-2 ${FOOTER_CONTACT_ROW_CENTER_CLASS}`}>
        <Image
          src={FOOTER_CONTACT_PHONE_ICON_SRC}
          alt=""
          width={18}
          height={15}
          className={FOOTER_CONTACT_PHONE_ICON_CLASS}
          aria-hidden
        />
        <div className="flex flex-col gap-0.5">
          {location.phones.map((phone) => (
            <a
              key={phone}
              href={phoneToTelHref(phone)}
              className={`${FOOTER_LINK_CLASS} hover:underline`}
            >
              {phone}
            </a>
          ))}
        </div>
      </div>
    </details>
  );
}

function FooterContactsColumn({ dictionary }: { dictionary: Dictionary }) {
  const footer = dictionary.footer;
  const locations = buildContactLocations(dictionary.contact.locations);

  return (
    <div
      className={`flex h-full w-full max-w-full flex-col gap-2 ${FOOTER_TABLET_COLUMN_CENTER_CLASS}`}
    >
      <p className={FOOTER_HEADING_CLASS}>{footer.contacts}</p>
      {locations.map((location) => (
        <FooterLocationContact key={location.id} location={location} />
      ))}
      <div className={`flex items-start gap-2 ${FOOTER_CONTACT_ROW_CENTER_CLASS}`}>
        <Image
          src={FOOTER_CONTACT_MAIL_ICON_SRC}
          alt=""
          width={20}
          height={14}
          className={FOOTER_CONTACT_MAIL_ICON_CLASS}
          aria-hidden
        />
        <a
          href={`mailto:${dictionary.contact.storeEmail}`}
          className={FOOTER_LINK_CLASS}
        >
          {dictionary.contact.storeEmail}
        </a>
      </div>
      <div className={`flex items-start gap-2 ${FOOTER_CONTACT_ROW_CENTER_CLASS}`}>
        <Image
          src={FOOTER_CONTACT_MAIL_ICON_SRC}
          alt=""
          width={20}
          height={14}
          className={FOOTER_CONTACT_MAIL_ICON_CLASS}
          aria-hidden
        />
        <a href={`mailto:${footer.secondaryEmail}`} className={FOOTER_LINK_CLASS}>
          {footer.secondaryEmail}
        </a>
      </div>
    </div>
  );
}

function FooterCopyrightStrip({ dictionary }: { dictionary: Dictionary }) {
  const year = new Date().getFullYear();
  const footer = dictionary.footer;

  return (
    <div className="mt-4 flex w-full flex-row items-center justify-between gap-2 border-t border-marco-slate/15 pt-3">
      <div className="flex shrink-0 justify-start">
        <FooterSocialTiles dictionary={dictionary} />
      </div>
      <div className="scrollbar-hide flex min-w-0 flex-1 justify-center overflow-x-auto px-2">
        <p className="inline-block whitespace-nowrap text-center text-[10px] leading-tight text-marco-slate sm:text-[11px] md:text-xs lg:text-[13px]">
          <span>{footer.copyrightBefore.replace("{year}", String(year))}</span>
          <a
            href={NEETRINO_STUDIO_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-marco-slate no-underline hover:opacity-80"
          >
            {footer.creditStudio}
          </a>
          <span>{footer.copyrightAfter}</span>
        </p>
      </div>
      <div className="flex shrink-0 justify-end">
        <FooterPaymentMarks ariaLabel={footer.paymentMethods} />
      </div>
    </div>
  );
}

export function SiteFooter({ dictionary, locale }: SiteFooterProps) {
  const footer = dictionary.footer;
  const companyItems: FooterNavItem[] = [
    { href: `/${locale}/products`, label: dictionary.nav.shop },
    { href: `/${locale}/about`, label: dictionary.nav.about },
    { href: `/${locale}/contact`, label: dictionary.nav.contact },
    { href: `/${locale}/brand`, label: dictionary.nav.brand },
    { href: `/${locale}/reels`, label: dictionary.nav.reels },
  ];
  const supportItems: FooterNavItem[] = [
    {
      href: `/${locale}/delivery-return`,
      label: footer.deliveryReturn,
    },
    {
      href: `/${locale}/legal/privacy`,
      label: footer.privacyPolicy,
    },
    {
      href: `/${locale}/legal/terms`,
      label: footer.terms,
    },
    {
      href: `/${locale}/refund-policy`,
      label: footer.refundPolicy,
    },
  ];

  return (
    <footer className={`storefront-footer hidden md:block ${FOOTER_SURFACE_CLASS}`}>
      <div className="mx-auto max-w-7xl px-4 pb-7 pt-6 sm:px-6 lg:px-8">
        <div className={FOOTER_MAIN_GRID_CLASS}>
          <div
            className={`relative flex max-w-sm flex-col md:max-[1023px]:items-center min-[1024px]:max-[1366px]:items-center lg:self-start ${FOOTER_BRAND_COLUMN_GAP_CLASS}`}
          >
            <div
              className={`${FOOTER_BRAND_LOGO_BOX_CLASS} ${FOOTER_BRAND_LOGO_SHIFT_CLASS}`}
            >
              <Image
                src={MARCO_LOGO_SRC}
                alt={dictionary.brand}
                fill
                className="object-contain object-left-top md:max-[1023px]:object-center min-[1024px]:max-[1366px]:object-center"
                sizes="380px"
              />
            </div>
            <p
              className={`${FOOTER_BRAND_DESCRIPTION_OVERLAP_CLASS} ${FOOTER_BRAND_DESCRIPTION_TEXT_CLASS}`}
            >
              {footer.brandDescription}
            </p>
          </div>

          <div className={FOOTER_NAV_THREE_COLUMN_ROW_CLASS}>
            <div className={FOOTER_GRID_COMPANY_SUPPORT_WRAPPER_CLASS}>
              <FooterNavColumn title={footer.company} items={companyItems} />
            </div>
            <div className={FOOTER_GRID_COMPANY_SUPPORT_WRAPPER_CLASS}>
              <FooterNavColumn title={footer.support} items={supportItems} />
            </div>
            <div className={FOOTER_GRID_CONTACTS_WRAPPER_CLASS}>
              <FooterContactsColumn dictionary={dictionary} />
            </div>
          </div>
        </div>
        <FooterCopyrightStrip dictionary={dictionary} />
      </div>
    </footer>
  );
}

import type { Locale } from "@/lib/i18n/config";

import enAbout from "@/locales/en/about.json";
import enAdmin from "@/locales/en/admin.json";
import enAuth from "@/locales/en/auth.json";
import enBlog from "@/locales/en/blog.json";
import enCart from "@/locales/en/cart.json";
import enCatalog from "@/locales/en/catalog.json";
import enCheckout from "@/locales/en/checkout.json";
import enCommon from "@/locales/en/common.json";
import enContact from "@/locales/en/contact.json";
import enDelivery from "@/locales/en/delivery.json";
import enPrivacy from "@/locales/en/privacy.json";
import enRefund from "@/locales/en/refund.json";
import enTerms from "@/locales/en/terms.json";
import enStores from "@/locales/en/stores.json";
import enHome from "@/locales/en/home.json";
import enProduct from "@/locales/en/product.json";
import enProfile from "@/locales/en/profile.json";
import enCompare from "@/locales/en/compare.json";
import enWishlist from "@/locales/en/wishlist.json";

import hyAbout from "@/locales/hy/about.json";
import hyAdmin from "@/locales/hy/admin.json";
import hyAuth from "@/locales/hy/auth.json";
import hyBlog from "@/locales/hy/blog.json";
import hyCart from "@/locales/hy/cart.json";
import hyCatalog from "@/locales/hy/catalog.json";
import hyCheckout from "@/locales/hy/checkout.json";
import hyCommon from "@/locales/hy/common.json";
import hyContact from "@/locales/hy/contact.json";
import hyDelivery from "@/locales/hy/delivery.json";
import hyPrivacy from "@/locales/hy/privacy.json";
import hyRefund from "@/locales/hy/refund.json";
import hyTerms from "@/locales/hy/terms.json";
import hyStores from "@/locales/hy/stores.json";
import hyHome from "@/locales/hy/home.json";
import hyProduct from "@/locales/hy/product.json";
import hyProfile from "@/locales/hy/profile.json";
import hyCompare from "@/locales/hy/compare.json";
import hyWishlist from "@/locales/hy/wishlist.json";

import ruAbout from "@/locales/ru/about.json";
import ruAdmin from "@/locales/ru/admin.json";
import ruAuth from "@/locales/ru/auth.json";
import ruBlog from "@/locales/ru/blog.json";
import ruCart from "@/locales/ru/cart.json";
import ruCatalog from "@/locales/ru/catalog.json";
import ruCheckout from "@/locales/ru/checkout.json";
import ruCommon from "@/locales/ru/common.json";
import ruContact from "@/locales/ru/contact.json";
import ruDelivery from "@/locales/ru/delivery.json";
import ruPrivacy from "@/locales/ru/privacy.json";
import ruRefund from "@/locales/ru/refund.json";
import ruTerms from "@/locales/ru/terms.json";
import ruStores from "@/locales/ru/stores.json";
import ruHome from "@/locales/ru/home.json";
import ruProduct from "@/locales/ru/product.json";
import ruProfile from "@/locales/ru/profile.json";
import ruCompare from "@/locales/ru/compare.json";
import ruWishlist from "@/locales/ru/wishlist.json";

type LocaleNamespaces = {
  common: typeof hyCommon;
  home: typeof hyHome;
  contact: typeof hyContact;
  deliveryReturn: typeof hyDelivery;
  privacy: typeof hyPrivacy;
  terms: typeof hyTerms;
  refundPolicy: typeof hyRefund;
  stores: typeof hyStores;
  about: typeof hyAbout;
  admin: typeof hyAdmin;
  auth: typeof hyAuth;
  profile: typeof hyProfile;
  checkout: typeof hyCheckout;
  cart: typeof hyCart;
  product: typeof hyProduct;
  blog: typeof hyBlog;
  catalog: typeof hyCatalog;
  wishlist: typeof hyWishlist;
  compare: typeof hyCompare;
};

function buildDictionary(namespaces: LocaleNamespaces) {
  return {
    brand: namespaces.common.brand,
    nav: namespaces.common.nav,
    header: namespaces.common.header,
    footer: namespaces.common.footer,
    tidio: namespaces.common.tidio,
    home: namespaces.home,
    contact: namespaces.contact,
    deliveryReturn: namespaces.deliveryReturn,
    privacy: namespaces.privacy,
    terms: namespaces.terms,
    refundPolicy: namespaces.refundPolicy,
    stores: namespaces.stores,
    about: namespaces.about,
    admin: namespaces.admin,
    auth: namespaces.auth,
    profile: namespaces.profile,
    checkout: namespaces.checkout,
    cartDrawer: namespaces.cart,
    product: namespaces.product,
    blog: namespaces.blog,
    catalog: namespaces.catalog,
    wishlist: namespaces.wishlist,
    compare: namespaces.compare,
  } as const;
}

const dictionaries = {
  hy: buildDictionary({
    common: hyCommon,
    home: hyHome,
    contact: hyContact,
    deliveryReturn: hyDelivery,
    privacy: hyPrivacy,
    terms: hyTerms,
    refundPolicy: hyRefund,
    stores: hyStores,
    about: hyAbout,
    admin: hyAdmin,
    auth: hyAuth,
    profile: hyProfile,
    checkout: hyCheckout,
    cart: hyCart,
    product: hyProduct,
    blog: hyBlog,
    catalog: hyCatalog,
    wishlist: hyWishlist,
    compare: hyCompare,
  }),
  en: buildDictionary({
    common: enCommon,
    home: enHome,
    contact: enContact,
    deliveryReturn: enDelivery,
    privacy: enPrivacy,
    terms: enTerms,
    refundPolicy: enRefund,
    stores: enStores,
    about: enAbout,
    admin: enAdmin,
    auth: enAuth,
    profile: enProfile,
    checkout: enCheckout,
    cart: enCart,
    product: enProduct,
    blog: enBlog,
    catalog: enCatalog,
    wishlist: enWishlist,
    compare: enCompare,
  }),
  ru: buildDictionary({
    common: ruCommon,
    home: ruHome,
    contact: ruContact,
    deliveryReturn: ruDelivery,
    privacy: ruPrivacy,
    terms: ruTerms,
    refundPolicy: ruRefund,
    stores: ruStores,
    about: ruAbout,
    admin: ruAdmin,
    auth: ruAuth,
    profile: ruProfile,
    checkout: ruCheckout,
    cart: ruCart,
    product: ruProduct,
    blog: ruBlog,
    catalog: ruCatalog,
    wishlist: ruWishlist,
    compare: ruCompare,
  }),
} as const;

export type Dictionary = (typeof dictionaries)[Locale];

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

import { describe, expect, it } from "vitest";

import { getDictionary } from "@/lib/i18n/get-dictionary";

describe("getDictionary", () => {
  it("merges namespace files into the storefront dictionary shape", () => {
    const dictionary = getDictionary("en");

    expect(dictionary.brand).toBe("MARCO");
    expect(dictionary.nav.home).toBe("Home");
    expect(dictionary.nav.brand).toBe("Brands");
    expect(dictionary.nav.reels).toBe("Reels");
    expect(dictionary.nav.stores).toBe("Stores");
    expect(dictionary.catalog.sortLabel).toBe("Sort");
    expect(dictionary.catalog.withPrice).toBe("With price");
    expect(dictionary.home.title).toBe("White Shop");
    expect(dictionary.contact.title).toBe("CONTACT US");
    expect(dictionary.header.socialBrands.marcoGroup).toBe("Marco Group");
    expect(dictionary.contact.drawerCall.cta).toBe("Call");
    expect(dictionary.deliveryReturn.title).toBe("Delivery and Returns");
    expect(dictionary.privacy.title).toBe("Privacy Policy");
    expect(dictionary.terms.title).toBe("Terms and Conditions");
    expect(dictionary.refundPolicy.title).toBe("Refund Policy");
    expect(dictionary.nav.menuCopyright).toContain("MARCO GROUP");
    expect(dictionary.cartDrawer.title).toBe("My Cart");
    expect(dictionary.checkout.title).toBe("Checkout");
    expect(dictionary.checkout.coupon.title).toBe("Promo code");
    expect(dictionary.checkout.form.notes).toBe("Order notes (optional)");
    expect(dictionary.wishlist.title).toBe("My Wishlist");
    expect(dictionary.wishlist.browseProducts).toBe("Browse Products");
    expect(dictionary.profile.savedAddresses).toBe("Saved addresses");
    expect(dictionary.profile.closeSheet).toBe("Close");
    expect(dictionary.admin.nav.dashboard).toBe("Dashboard");
    expect(dictionary.admin.dashboard.title).toBe("Admin Page");
    expect(dictionary.admin.products.title).toBe("Products");
  });

  it("loads Armenian and Russian namespaces", () => {
    expect(getDictionary("hy").nav.home).toBe("Գլխավոր");
    expect(getDictionary("ru").nav.home).toBe("Главная");
    expect(getDictionary("hy").deliveryReturn.title).toBe("Առաքում և վերադարձ");
    expect(getDictionary("ru").deliveryReturn.title).toBe("Доставка и возврат");
    expect(getDictionary("hy").privacy.title).toBe(
      "Գաղտնիության քաղաքականություն",
    );
    expect(getDictionary("ru").privacy.title).toBe("Политика конфиденциальности");
    expect(getDictionary("hy").terms.title).toBe("Օգտագործման պայմաններ");
    expect(getDictionary("ru").terms.title).toBe("Условия использования");
    expect(getDictionary("hy").refundPolicy.title).toBe(
      "Փոխհատուցման քաղաքականություն",
    );
    expect(getDictionary("ru").refundPolicy.title).toBe("Политика возврата");
    expect(getDictionary("hy").admin.nav.dashboard).toBe("Վահանակ");
    expect(getDictionary("ru").admin.nav.dashboard).toBe("Панель");
    expect(getDictionary("hy").admin.dashboard.title).toBe("Ադմին էջ");
    expect(getDictionary("ru").admin.orders.title).toBe("Заказы");
    expect(getDictionary("hy").tidio.widgetLabel).toBe(
      "Ինչո՞վ կարող ենք Ձեզ օգնել",
    );
    expect(getDictionary("ru").tidio.widgetLabel).toBe(
      "Чем мы можем вам помочь?",
    );
  });

  it("exposes storefront auth form copy", () => {
    expect(getDictionary("hy").auth.signUp).toBe("Գրանցվել");
    expect(getDictionary("en").auth.noAccount).toBe("Don't have an account?");
    expect(getDictionary("ru").auth.submitLogin).toBe("Войти");
  });
});

import { describe, expect, it } from "vitest";

import {
  TIDIO_PUBLIC_KEY,
  tidioScriptSrc,
  tidioWidgetLabelFeatures,
} from "@/components/layout/tidio-chat";

describe("tidioScriptSrc", () => {
  it("builds the official widget URL from the public key", () => {
    expect(tidioScriptSrc()).toBe(
      `https://code.tidio.co/${TIDIO_PUBLIC_KEY}.js`,
    );
  });

  it("rejects a key that is not a Tidio public id", () => {
    expect(() => tidioScriptSrc("../evil")).toThrow("Invalid Tidio public key");
  });
});

describe("tidioWidgetLabelFeatures", () => {
  it("enables the closed-widget label with the given copy", () => {
    expect(tidioWidgetLabelFeatures("Ինչո՞վ կարող ենք Ձեզ օգնել")).toEqual({
      widgetLabelStatus: true,
      widgetLabelText: "Ինչո՞վ կարող ենք Ձեզ օգնել",
      hideChatWithUsOnHome: true,
    });
  });
});

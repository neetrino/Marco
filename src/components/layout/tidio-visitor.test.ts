import { describe, expect, it } from "vitest";

import {
  assignTidioIdentifySnippet,
  buildTidioVisitorIdentity,
} from "@/components/layout/tidio-visitor";

const signedInUser = {
  id: "01900000-0000-7000-8000-000000000001",
  email: "marco@example.com",
  firstName: "Anna",
  lastName: "Hakobyan",
  phone: "+374 93 52 04 06",
};

describe("buildTidioVisitorIdentity", () => {
  it("maps a signed-in user to Tidio visitor fields", () => {
    expect(buildTidioVisitorIdentity(signedInUser)).toEqual({
      distinct_id: signedInUser.id,
      email: "marco@example.com",
      name: "Anna Hakobyan",
      phone: "+37493520406",
    });
  });

  it("returns null when the email is not valid", () => {
    expect(
      buildTidioVisitorIdentity({ ...signedInUser, email: "not-an-email" }),
    ).toBeNull();
  });

  it("omits phone when it is missing or not E.164", () => {
    expect(
      buildTidioVisitorIdentity({ ...signedInUser, phone: "93 52 04 06" }),
    ).toEqual({
      distinct_id: signedInUser.id,
      email: "marco@example.com",
      name: "Anna Hakobyan",
    });
  });
});

describe("assignTidioIdentifySnippet", () => {
  it("serializes visitor data for document.tidioIdentify", () => {
    const visitor = buildTidioVisitorIdentity(signedInUser);
    expect(visitor).not.toBeNull();
    if (!visitor) {
      return;
    }

    expect(assignTidioIdentifySnippet(visitor)).toBe(
      `document.tidioIdentify=${JSON.stringify(visitor)};`,
    );
  });
});

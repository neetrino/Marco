import { describe, expect, it } from "vitest";

import {
  extensionForImageMime,
  validateCategoryIconFile,
  validateImageFile,
} from "@/lib/media/image-file";

function fileOf(type: string, size = 16): File {
  return new File([new Uint8Array(size)], "icon", { type });
}

describe("validateCategoryIconFile", () => {
  it("allows svg icons in addition to raster images", () => {
    expect(validateCategoryIconFile(fileOf("image/svg+xml"))).toBeNull();
    expect(validateCategoryIconFile(fileOf("image/png"))).toBeNull();
    expect(validateImageFile(fileOf("image/svg+xml"))).not.toBeNull();
  });
});

describe("extensionForImageMime", () => {
  it("maps svg mime types", () => {
    expect(extensionForImageMime("image/svg+xml")).toBe("svg");
  });
});

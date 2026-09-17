import { describe, expect, it } from "vitest";

import {
  extensionForImageMime,
  isNonEmptyImageFile,
  MAX_PRODUCT_GALLERY_IMAGES,
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

describe("validateImageFile", () => {
  it("rejects files larger than 5MB", () => {
    expect(validateImageFile(fileOf("image/png", 5 * 1024 * 1024 + 1))).toBe(
      "Image must be 5MB or smaller.",
    );
  });
});

describe("extensionForImageMime", () => {
  it("maps svg mime types", () => {
    expect(extensionForImageMime("image/svg+xml")).toBe("svg");
  });
});

describe("isNonEmptyImageFile", () => {
  it("accepts a non-empty File", () => {
    expect(isNonEmptyImageFile(fileOf("image/png"))).toBe(true);
  });

  it("rejects empty files and non-file entries", () => {
    expect(isNonEmptyImageFile(fileOf("image/png", 0))).toBe(false);
    expect(isNonEmptyImageFile("not-a-file")).toBe(false);
  });
});

describe("MAX_PRODUCT_GALLERY_IMAGES", () => {
  it("caps the admin gallery at 12 images", () => {
    expect(MAX_PRODUCT_GALLERY_IMAGES).toBe(12);
  });
});


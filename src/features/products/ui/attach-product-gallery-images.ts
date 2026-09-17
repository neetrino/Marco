import { attachProductMediaFromDrawerAction } from "@/features/products/application/attach-product-media";
import type { ProductDraftImage } from "@/features/products/ui/ProductDrawerImages";

export type AttachProductGalleryResult = {
  error: string | null;
  uploadedKeys: string[];
};

/** Uploads each new gallery image in its own request to avoid a huge Server Action body. */
export async function attachProductGalleryImages(
  locale: string,
  productId: string,
  images: readonly ProductDraftImage[],
): Promise<AttachProductGalleryResult> {
  const uploadedKeys: string[] = [];
  const newImages = images.filter((image) => image.file);

  for (const image of newImages) {
    const file = image.file;
    if (!file) continue;

    const formData = new FormData();
    formData.set("image", file);
    if (image.isPrimary) formData.set("isPrimary", "1");

    const result = await attachProductMediaFromDrawerAction(
      locale,
      productId,
      formData,
    );
    if (!result.ok) {
      return { error: result.error.message, uploadedKeys };
    }
    uploadedKeys.push(image.key);
  }

  return { error: null, uploadedKeys };
}

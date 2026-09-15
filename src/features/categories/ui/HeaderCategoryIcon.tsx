import Image from "next/image";

import {
  isSvgImageSrc,
  resolveHeaderCategoryIconUrl,
} from "@/features/categories/domain/header-category-icon";

type HeaderCategoryIconProps = {
  slug: string;
  title: string;
  imageUrl: string | null;
  size: number;
};

export function HeaderCategoryIcon({
  slug,
  title,
  imageUrl,
  size,
}: HeaderCategoryIconProps) {
  const src = resolveHeaderCategoryIconUrl(slug, title, imageUrl);
  const isUploaded = Boolean(imageUrl && imageUrl.trim() !== "");
  const isSvg = isSvgImageSrc(src);

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 object-contain ${isUploaded ? "" : "brightness-0"}`}
      style={{ width: size, height: size }}
      unoptimized={isSvg}
      draggable={false}
    />
  );
}

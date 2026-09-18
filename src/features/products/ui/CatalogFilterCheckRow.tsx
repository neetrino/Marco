"use client";

import Image from "next/image";

import {
  CATALOG_CHECKBOX_BOX,
  CATALOG_FILTER_BRAND_LOGO_CLASS,
  CATALOG_FILTER_BRAND_LOGO_HEIGHT_PX,
  CATALOG_FILTER_BRAND_LOGO_WIDTH_PX,
  CATALOG_FILTER_COUNT,
  CATALOG_FILTER_ROW,
  CATALOG_FILTER_ROW_LABEL_GROUP,
  catalogFilterCheckIconClass,
  catalogFilterCheckboxToneClass,
  type CatalogFilterCheckboxVariant,
} from "@/features/products/ui/catalog-filter-classes";

type CatalogFilterCheckRowProps = {
  label: string;
  selected: boolean;
  count?: number;
  imageUrl?: string | null;
  labelClassName: string;
  variant?: CatalogFilterCheckboxVariant;
  onToggle: () => void;
};

function CatalogFilterCheckIcon({
  variant,
}: {
  variant: CatalogFilterCheckboxVariant;
}) {
  return (
    <svg
      width="12"
      height="10"
      viewBox="0 0 12 10"
      fill="none"
      className={catalogFilterCheckIconClass(variant)}
      aria-hidden
    >
      <path
        d="M1 5l3.5 3.5L11 1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CatalogFilterCheckRow({
  label,
  selected,
  count,
  imageUrl,
  labelClassName,
  variant = "checkmark",
  onToggle,
}: CatalogFilterCheckRowProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`${CATALOG_FILTER_ROW} hover:opacity-90`}
    >
      <span
        className={`${CATALOG_CHECKBOX_BOX} ${catalogFilterCheckboxToneClass(selected, variant)}`}
        aria-hidden
      >
        {selected ? <CatalogFilterCheckIcon variant={variant} /> : null}
      </span>
      <span className={CATALOG_FILTER_ROW_LABEL_GROUP}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            width={CATALOG_FILTER_BRAND_LOGO_WIDTH_PX}
            height={CATALOG_FILTER_BRAND_LOGO_HEIGHT_PX}
            className={CATALOG_FILTER_BRAND_LOGO_CLASS}
          />
        ) : null}
        <span className={`min-w-0 flex-1 truncate ${labelClassName}`}>{label}</span>
      </span>
      {count != null ? (
        <span className={CATALOG_FILTER_COUNT}>({count})</span>
      ) : null}
    </button>
  );
}

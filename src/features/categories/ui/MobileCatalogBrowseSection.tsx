"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { AppLink } from "@/components/ui/AppLink";
import type { HeaderCategoryNode } from "@/features/categories/domain/header-category-menu";
import { HeaderCategoryIcon } from "@/features/categories/ui/HeaderCategoryIcon";
import {
  MOBILE_BROWSE_NESTED_LIST_CLASS,
  MOBILE_BROWSE_ROW_CLASS,
  MOBILE_BROWSE_ROW_EXPAND_CLASS,
  MOBILE_BROWSE_ROW_LABEL_CLASS,
  MOBILE_BROWSE_SECTION_CLASS,
  MOBILE_BROWSE_SECTION_LIST_CLASS,
  MOBILE_BROWSE_SECTION_TITLE_CLASS,
} from "@/features/categories/ui/mobile-catalog-browse.classes";

const ROW_ICON_PX = 28;

type MobileCatalogBrowseSectionProps = {
  category: HeaderCategoryNode;
  hrefFor: (slug: string) => string;
  expandLabel: string;
  collapseLabel: string;
  onNavigate: () => void;
};

/**
 * Root title + subcategory tree.
 * Group parents keep desktop mega-menu icons; nested children are text-only.
 */
export function MobileCatalogBrowseSection({
  category,
  hrefFor,
  expandLabel,
  collapseLabel,
  onNavigate,
}: MobileCatalogBrowseSectionProps) {
  const headingId = `mobile-browse-section-${category.id}`;
  const categoryHref = hrefFor(category.slug);
  const children = category.children;

  return (
    <section className={MOBILE_BROWSE_SECTION_CLASS} aria-labelledby={headingId}>
      <h2 id={headingId} className={MOBILE_BROWSE_SECTION_TITLE_CLASS}>
        <AppLink
          href={categoryHref}
          prefetchPolicy="none"
          onClick={onNavigate}
          className="hover:opacity-90"
        >
          {category.title}
        </AppLink>
      </h2>

      {children.length > 0 ? (
        <ul className={MOBILE_BROWSE_SECTION_LIST_CLASS}>
          {children.map((child) => (
            <CategoryTreeRow
              key={child.id}
              node={child}
              depth={0}
              hrefFor={hrefFor}
              expandLabel={expandLabel}
              collapseLabel={collapseLabel}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function CategoryTreeRow({
  node,
  depth,
  hrefFor,
  expandLabel,
  collapseLabel,
  onNavigate,
}: {
  node: HeaderCategoryNode;
  depth: number;
  hrefFor: (slug: string) => string;
  expandLabel: string;
  collapseLabel: string;
  onNavigate: () => void;
}) {
  const hasChildren = node.children.length > 0;
  const [open, setOpen] = useState(false);
  const isGroupParent = depth === 0;
  const padLeft = isGroupParent ? 7 : 7 + Math.min(depth, 3) * 12;

  return (
    <li>
      <div className={MOBILE_BROWSE_ROW_CLASS} style={{ paddingLeft: padLeft }}>
        <AppLink
          href={hrefFor(node.slug)}
          prefetchPolicy="none"
          onClick={onNavigate}
          className="flex min-w-0 flex-1 items-center gap-1"
        >
          {isGroupParent ? (
            <span className="flex size-[52px] shrink-0 items-center justify-center p-[7px] text-marco-slate">
              <HeaderCategoryIcon
                slug={node.slug}
                title={node.title}
                imageUrl={node.imageUrl}
                size={ROW_ICON_PX}
              />
            </span>
          ) : null}
          <span
            className={
              isGroupParent
                ? `${MOBILE_BROWSE_ROW_LABEL_CLASS} font-semibold text-black/80`
                : MOBILE_BROWSE_ROW_LABEL_CLASS
            }
          >
            {node.title}
          </span>
        </AppLink>

        {hasChildren ? (
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? collapseLabel : expandLabel}
            className={MOBILE_BROWSE_ROW_EXPAND_CLASS}
            onClick={() => setOpen((current) => !current)}
          >
            <ChevronDown
              className={`size-5 transition-transform ${open ? "rotate-0" : "-rotate-90"}`}
              strokeWidth={1.75}
              aria-hidden
            />
          </button>
        ) : (
          <span className="w-9 shrink-0" aria-hidden />
        )}
      </div>

      {hasChildren && open ? (
        <ul className={MOBILE_BROWSE_NESTED_LIST_CLASS}>
          {node.children.map((child) => (
            <CategoryTreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              hrefFor={hrefFor}
              expandLabel={expandLabel}
              collapseLabel={collapseLabel}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

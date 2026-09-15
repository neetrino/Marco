"use client";

import { useState } from "react";

import { AppLink } from "@/components/ui/AppLink";
import {
  visibleCategoryDescendants,
  type HeaderCategoryGroup,
  type HeaderCategoryNode,
} from "@/features/categories/domain/header-category-menu";
import { HeaderCategoryIcon } from "@/features/categories/ui/HeaderCategoryIcon";
import {
  HEADER_CATEGORY_CHILD_LINK_CLASS,
  HEADER_CATEGORY_GRID_CLASS,
  HEADER_CATEGORY_PARENT_LINK_CLASS,
  HEADER_CATEGORY_SEE_ALL_CLASS,
} from "@/features/categories/ui/header-category-menu.classes";

const SUB_ICON_PX = 26;

type HeaderCategoryGroupsProps = {
  headingId: string;
  groups: readonly HeaderCategoryGroup[];
  hrefFor: (slug: string) => string;
  seeAllLabel: string;
  onNavigate: () => void;
};

export function HeaderCategoryGroups({
  headingId,
  groups,
  hrefFor,
  seeAllLabel,
  onNavigate,
}: HeaderCategoryGroupsProps) {
  if (groups.length === 0) return null;

  return (
    <ul aria-labelledby={headingId} className={HEADER_CATEGORY_GRID_CLASS}>
      {groups.map((group) => (
        <li key={group.parent.id} className="min-w-0 w-full">
          <GroupParent
            parent={group.parent}
            href={hrefFor(group.parent.slug)}
            onNavigate={onNavigate}
          />
          {group.children.length > 0 ? (
            <DescendantList
              categories={group.children}
              hrefFor={hrefFor}
              seeAllLabel={seeAllLabel}
              onNavigate={onNavigate}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function GroupParent({
  parent,
  href,
  onNavigate,
}: {
  parent: HeaderCategoryNode;
  href: string;
  onNavigate: () => void;
}) {
  return (
    <div className="mb-2 min-w-0">
      <AppLink
        href={href}
        prefetchPolicy="none"
        onClick={onNavigate}
        className={HEADER_CATEGORY_PARENT_LINK_CLASS}
      >
        <span className="mt-0.5 flex size-[34px] shrink-0 items-center justify-center text-marco-slate">
          <HeaderCategoryIcon
            slug={parent.slug}
            title={parent.title}
            imageUrl={parent.imageUrl}
            size={SUB_ICON_PX}
          />
        </span>
        <span className="min-w-0 flex-1 text-left text-sm font-bold leading-[18px] tracking-[0.14px]">
          {parent.title}
        </span>
        {parent.count > 0 ? (
          <span className="mt-0.5 shrink-0 whitespace-nowrap text-sm tabular-nums text-marco-slate/60">
            ({parent.count})
          </span>
        ) : null}
      </AppLink>
    </div>
  );
}

function DescendantList({
  categories,
  hrefFor,
  seeAllLabel,
  onNavigate,
  level = 0,
}: {
  categories: readonly HeaderCategoryNode[];
  hrefFor: (slug: string) => string;
  seeAllLabel: string;
  onNavigate: () => void;
  level?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = visibleCategoryDescendants(categories, expanded);
  const hasMore = categories.length > visible.length;

  return (
    <ul
      className={
        level > 0
          ? "mt-1 flex flex-col gap-0.5 border-l border-marco-gray pl-3"
          : "flex flex-col gap-0.5 pl-1"
      }
    >
      {visible.map((category) => (
        <li key={category.id}>
          <AppLink
            href={hrefFor(category.slug)}
            prefetchPolicy="none"
            onClick={onNavigate}
            className={HEADER_CATEGORY_CHILD_LINK_CLASS}
          >
            {category.title}
          </AppLink>
          {category.children.length > 0 ? (
            <DescendantList
              categories={category.children}
              hrefFor={hrefFor}
              seeAllLabel={seeAllLabel}
              onNavigate={onNavigate}
              level={level + 1}
            />
          ) : null}
        </li>
      ))}
      {hasMore ? (
        <li>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className={HEADER_CATEGORY_SEE_ALL_CLASS}
          >
            {seeAllLabel}
          </button>
        </li>
      ) : null}
    </ul>
  );
}


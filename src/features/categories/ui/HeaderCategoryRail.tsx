import { ChevronRight } from "lucide-react";
import { memo } from "react";

import type { HeaderCategoryNode } from "@/features/categories/domain/header-category-menu";
import { HeaderCategoryIcon } from "@/features/categories/ui/HeaderCategoryIcon";
import {
  HEADER_CATEGORY_RAIL_PADDING_CLASS,
  HEADER_CATEGORY_RAIL_WIDTH_CLASS,
  HEADER_CATEGORY_ROOT_IDLE_CLASS,
  HEADER_CATEGORY_ROOT_ROW_CLASS,
  HEADER_CATEGORY_ROOT_SELECTED_CLASS,
} from "@/features/categories/ui/header-category-menu.classes";

const ROOT_ICON_PX = 28;

type HeaderCategoryRailProps = {
  categories: readonly HeaderCategoryNode[];
  selectedId: string;
  ariaLabel: string;
  onSelect: (id: string) => void;
};

export function HeaderCategoryRail({
  categories,
  selectedId,
  ariaLabel,
  onSelect,
}: HeaderCategoryRailProps) {
  return (
    <div
      className={`relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden border-r border-black/[0.08] md:min-h-0 md:flex-none md:shrink-0 ${HEADER_CATEGORY_RAIL_WIDTH_CLASS}`}
    >
      <nav
        className={`flex h-full min-h-0 flex-1 flex-col overflow-hidden pr-0 ${HEADER_CATEGORY_RAIL_PADDING_CLASS}`}
        aria-label={ariaLabel}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain pr-0">
          <div className="flex flex-col gap-3 pr-1.5">
            {categories.map((category) => (
              <MemoRailRow
                key={category.id}
                category={category}
                selected={category.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}

function RailRow({
  category,
  selected,
  onSelect,
}: RailRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(category.id)}
      className={`${HEADER_CATEGORY_ROOT_ROW_CLASS} ${
        selected
          ? HEADER_CATEGORY_ROOT_SELECTED_CLASS
          : HEADER_CATEGORY_ROOT_IDLE_CLASS
      }`}
    >
      <span className="mt-1 flex size-10 shrink-0 items-center justify-center p-1 text-marco-slate">
        <HeaderCategoryIcon
          slug={category.slug}
          title={category.title}
          imageUrl={category.imageUrl}
          size={ROOT_ICON_PX}
        />
      </span>
      <span className="min-w-0 flex-1 pt-2 pb-1 pr-1 text-left break-words whitespace-normal [overflow-wrap:anywhere]">
        {category.title}
      </span>
      <ChevronRight
        className="mt-2 size-[18px] shrink-0 self-start text-marco-slate/55 md:size-5"
        strokeWidth={2}
        aria-hidden
      />
    </button>
  );
}

type RailRowProps = {
  category: HeaderCategoryNode;
  selected: boolean;
  onSelect: (id: string) => void;
};

const MemoRailRow = memo(RailRow);

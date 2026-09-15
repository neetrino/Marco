"use client";

import Image from "next/image";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import type { AdminCategoryListItem } from "@/features/categories/application/list-admin-categories";
import type { CategoryTreeNode } from "@/features/categories/domain/category-tree";
import {
  isSvgImageSrc,
  resolveAdminCategoryIconUrl,
} from "@/features/categories/domain/header-category-icon";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type CategoriesCopy = Dictionary["admin"]["categories"];

export type CategoryTreeHandlers = {
  copy: CategoriesCopy;
  expandedIds: Set<string>;
  draggingId: string | null;
  isFiltering: boolean;
  isPending: boolean;
  onToggle: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onEdit: (category: AdminCategoryListItem) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string, title: string) => void;
};

type AdminCategoryTreeNodeProps = {
  node: CategoryTreeNode<AdminCategoryListItem>;
  handlers: CategoryTreeHandlers;
};

export function AdminCategoryTreeNode({
  node,
  handlers,
}: AdminCategoryTreeNodeProps) {
  const expanded = handlers.expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const isDragging = handlers.draggingId === node.id;
  const { copy } = handlers;
  const iconSrc = resolveAdminCategoryIconUrl(
    node.slug,
    node.title,
    node.imageUrl,
  );

  return (
    <div className="space-y-2">
      <div
        className={`grid grid-cols-[auto_auto_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2.5 ${
          isDragging ? "opacity-50 shadow-sm" : ""
        }`}
        onDragOver={(event) => {
          if (handlers.isFiltering || !handlers.draggingId) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          handlers.onDragOver(node.id);
        }}
        onDrop={(event) => {
          event.preventDefault();
          handlers.onDrop();
        }}
      >
        <button
          type="button"
          draggable={!handlers.isFiltering && !handlers.isPending}
          disabled={handlers.isFiltering || handlers.isPending}
          onDragStart={(event) => {
            if (handlers.isFiltering) {
              event.preventDefault();
              return;
            }
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", node.id);
            handlers.onDragStart(node.id);
          }}
          onDragEnd={handlers.onDragEnd}
          className="inline-flex cursor-grab touch-none text-gray-400 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`${copy.reorder} ${node.title}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50">
          {iconSrc ? (
            <Image
              src={iconSrc}
              alt=""
              fill
              sizes="40px"
              className="object-contain p-1"
              unoptimized={isSvgImageSrc(iconSrc)}
            />
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => handlers.onToggle(node.id)}
                className="rounded p-0.5 text-gray-500 hover:bg-gray-100"
                aria-expanded={expanded}
                aria-label={expanded ? copy.collapse : copy.expand}
              >
                {expanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : null}
            <p className="truncate font-medium text-gray-900">{node.title}</p>
          </div>
          {node.slug ? (
            <p
              className={`truncate text-xs text-gray-400 ${
                hasChildren ? "pl-5" : ""
              }`}
            >
              {node.slug}
            </p>
          ) : null}
        </div>

        <span className="inline-flex min-w-8 justify-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
          {node.childCount}
        </span>

        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => handlers.onAddChild(node.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100"
            aria-label={`${copy.addChild} ${node.title}`}
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handlers.onEdit(node)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-gray-500 hover:bg-slate-100 hover:text-gray-900"
            aria-label={`${copy.edit} ${node.title}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={handlers.isPending}
            onClick={() => handlers.onDelete(node.id, node.title)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
            aria-label={`${copy.delete} ${node.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded && hasChildren ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-3">
          <p className="mb-2 text-xs font-semibold tracking-wide text-amber-800 uppercase">
            {copy.childrenHeading}
          </p>
          <div className="space-y-2">
            {node.children.map((child) => (
              <AdminCategoryTreeNode
                key={child.id}
                node={child}
                handlers={handlers}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

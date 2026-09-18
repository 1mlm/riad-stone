"use client";

import { BrushCleaningIcon, Delete02Icon } from "@hugeicons/core-free-icons";
import { type ReactNode, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/shadcn/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { cn } from "@/shadcn/utils";
import { ICONS } from "@/utils/icon";
import type { CustomTableColumn } from "./CustomTable";
import { ExtractButton } from "./ExtractButton";
import type { CustomTableLabels } from "./labels";

function PageJumpPopover({
  currentPage,
  pageCount,
  onJump,
  label,
  goLabel,
}: {
  currentPage: number;
  pageCount: number;
  onJump: (page: number) => void;
  label: string;
  goLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  return (
    <Popover
      {...{ open }}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setValue(String(currentPage));
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="rounded-sm px-2 text-sm whitespace-nowrap text-muted-foreground hover:text-foreground hover:underline"
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const target = Number(value);
            if (Number.isInteger(target))
              onJump(Math.min(Math.max(target, 1), pageCount));
            setOpen(false);
          }}
        >
          <Input
            type="number"
            min={1}
            max={pageCount}
            autoFocus
            {...{ value }}
            onChange={(e) => setValue(e.target.value)}
            className="h-8 w-20"
          />
          <Button type="submit" size="sm">
            {goLabel}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

// floating bottom bar: pagination controls, filter/sort reset, selection
// actions (cancel/bulk-delete/export). Renders nothing when there's nothing
// to show, so callers can mount it unconditionally
export function CustomTableActionBar<T>({
  currentPage,
  setPage,
  pageCount,
  canResetFilterAndSort,
  resetFilterAndSort,
  selectable,
  selectionMode,
  clearSelection,
  selectedItems,
  onDeleteSelected,
  columns,
  labels,
  exportFilePrefix,
  selectionActions,
  placement = "fixed",
  showExtract = true,
}: {
  currentPage: number;
  setPage: (page: number) => void;
  pageCount: number;
  canResetFilterAndSort: boolean;
  resetFilterAndSort: () => void;
  selectable?: boolean;
  selectionMode: boolean;
  clearSelection: () => void;
  selectedItems: T[];
  onDeleteSelected?: (items: T[]) => Promise<{ error: string | null }>;
  columns: CustomTableColumn<T>[];
  labels: CustomTableLabels;
  exportFilePrefix: string;
  // extra buttons rendered alongside the built-in selection actions, e.g. a
  // caller-specific "Import selected" — mirrors how a "buttons" column's
  // getButtons(item, selectItem) already lets a caller slot its own actions
  // in next to a ready-made one
  selectionActions?: (items: T[]) => ReactNode;
  // "fixed" (default) floats the bar over the viewport, which is right for
  // a full page but collides with a dialog's own footer — "inline" renders
  // it as a normal flow element instead, for a table embedded in a dialog
  placement?: "fixed" | "inline";
  // off for a table whose rows aren't real persisted data yet (e.g. an
  // unsaved import preview) — exporting them reads as more official than
  // it is
  showExtract?: boolean;
}) {
  const hasSelection = Boolean(selectable) && selectedItems.length > 0;
  const showActionBar = canResetFilterAndSort || hasSelection || pageCount > 1;
  if (!showActionBar) return null;

  return (
    <div
      className={cn(
        "flex flex-col items-end gap-2 border border-border bg-sidebar px-4 py-2 sm:flex-row",
        placement === "fixed"
          ? "fixed inset-x-4 bottom-4 rounded-full corner-squircle shadow-[0_0_16px_rgba(0,0,0,0.35)] sm:inset-x-auto sm:bottom-8 sm:right-8"
          : "w-full rounded-lg corner-squircle sm:items-center sm:justify-end",
      )}
    >
      {pageCount > 1 && (
        <Pagination className="w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setPage(currentPage - 1);
                }}
              />
            </PaginationItem>
            <PaginationItem>
              <PageJumpPopover
                {...{ currentPage, pageCount }}
                onJump={setPage}
                label={labels.pageOf(currentPage, pageCount)}
                goLabel={labels.go}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                className={
                  currentPage === pageCount
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < pageCount) setPage(currentPage + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      {canResetFilterAndSort && (
        <Button
          variant="outline"
          className="shadow-lg"
          onClick={resetFilterAndSort}
        >
          <Icon icon={BrushCleaningIcon} />
          <span className="hidden sm:inline">{labels.resetFilters}</span>
          <span className="sm:hidden">{labels.resetFiltersShort}</span>
        </Button>
      )}
      {selectable && selectionMode && (
        <Button
          variant="outline"
          className="shadow-lg"
          onClick={clearSelection}
        >
          <Icon icon={ICONS.cancel} />
          {labels.cancelSelection}
        </Button>
      )}
      {hasSelection && selectionActions?.(selectedItems)}
      {selectable && onDeleteSelected && selectedItems.length > 0 && (
        <ConfirmDialog
          trigger={
            <Button variant="destructive" className="shadow-lg">
              <Icon icon={Delete02Icon} />
              <span className="hidden sm:inline">
                {labels.deleteSelected(selectedItems.length)}
              </span>
              <span className="sm:hidden">
                {labels.deleteSelectedShort(selectedItems.length)}
              </span>
            </Button>
          }
          title={labels.deleteSelectedTitle(selectedItems.length)}
          content={labels.deleteSelectedContent}
          confirmLabel={labels.deleteSelected(selectedItems.length)}
          cancelLabel={labels.cancel}
          waitingLabel={labels.waiting}
          confirmIcon={Delete02Icon}
          onConfirm={async () => {
            const result = await onDeleteSelected(selectedItems);
            if (!result.error) clearSelection();
            return result;
          }}
        />
      )}
      {selectable && showExtract && (
        <ExtractButton
          {...{ selectedItems, columns, labels }}
          filePrefix={exportFilePrefix}
        />
      )}
    </div>
  );
}

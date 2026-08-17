"use client";

import {
  BrushCleaningIcon,
  Delete02Icon,
  InboxIcon,
  MouseRightClick04Icon,
  Tap04Icon,
} from "@hugeicons/core-free-icons";
import {
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { type HugeIcon, Icon } from "@/components/Icon";
import { MetaPage } from "@/components/MetaPage";
import { Button } from "@/shadcn/ui/button";
import { Checkbox } from "@/shadcn/ui/checkbox";
import { ContextMenuItem } from "@/shadcn/ui/context-menu";
import { Input } from "@/shadcn/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/shadcn/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { Skeleton } from "@/shadcn/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";
import { cn } from "@/shadcn/utils";
import { haptic } from "@/utils/haptics";
import { ICONS } from "@/utils/icon";
import { CustomTableCell } from "./CustomTableCell";
import { CustomTableColumnHeader } from "./CustomTableColumnHeader";
import { ExtractButton } from "./ExtractButton";
import {
  type ColumnFilterField,
  columnMatchesFilter,
  compareColumnValues,
  getColumnFilterFields,
  getFilterKey,
  getTriState,
  parseSort,
  serializeSort,
} from "./filtering";
import { type CustomTableLabels, resolveTableLabels } from "./labels";
import { RowContextMenu } from "./RowContextMenu";

const PAGE_SIZE = 25;

const SKELETON_ROW_KEYS = Array.from({ length: 8 }, (_, i) => `skeleton-${i}`);

const SCROLL_FADE_SIZE = 32;

const clampToUnit = (value: number) => Math.min(1, Math.max(0, value));

// alpha-masks the scroll container itself (not an overlay) so the fade
// blends correctly over striped/merged row backgrounds and the sticky
// header alike. leftProgress/rightProgress (0-1) ramp up over the first
// SCROLL_FADE_SIZE px of scroll instead of snapping on at 1px, so a tiny
// scroll shows a faint fade and a bigger one shows the full fade — same
// feel as shadcn's scroll-fade.
// the sticky checkbox column stays fully opaque — it never scrolls out of
// view, so fading it would be misleading — the fade starts right after it
function getScrollFadeMask(
  leftProgress: number,
  rightProgress: number,
  stickyRegionWidth: number,
) {
  const leftAlpha = 1 - leftProgress;
  const rightAlpha = 1 - rightProgress;
  const left = `black ${stickyRegionWidth}px, rgba(0,0,0,${leftAlpha}) ${stickyRegionWidth}px, black ${stickyRegionWidth + SCROLL_FADE_SIZE}px`;
  const right = `black calc(100% - ${SCROLL_FADE_SIZE}px), rgba(0,0,0,${rightAlpha})`;
  return `linear-gradient(to right, ${left}, ${right})`;
}

export type CustomTableEnumValue = {
  label: string;
  icon: HugeIcon;
  // free string, not the narrow Color union — a fixed status badge passes a literal
  // (e.g. 'green'), but a user-editable tag passes whatever colorId it was saved with
  color: string;
  // extra terms matched by tag text-search filters but never displayed
  keywords?: string[];
  // makes the badge itself clickable, e.g. a tag opening a detail view
  onClick?: () => void;
};

export type CustomTableColumn<T> = {
  id: string;
  label: string;
  icon: HugeIcon;
} & (
  | {
      type: "string";
      monospace?: boolean;
      align?: "left" | "right";
      // 'number' switches the filter UI to a min/max range, 'length' does the
      // same but with a unit dropdown (min/max are still stored in the same
      // unit getNumber returns, the widget converts on the way in and out)
      filterType?: "text" | "number" | "length";
      // used for the numeric range filter/sort when getString isn't a raw parsable number (e.g. formatted currency)
      getNumber?: (item: T) => number;
      // truncates the middle instead of the end, keeping both the start and the tail visible
      truncate?: "middle";
      // renders getNumber's value via AlignedNumber instead of getString: fixed
      // decimal-point column alignment without padding every row with zeros
      decimals?: number;
      // shown after the label in the header (e.g. "(cm)"), never inside the cell
      suffix?: string;
      getString: (item: T) => string;
      // renders the value as a clickable button instead of plain text
      onClick?: (item: T) => void;
      // merges consecutive rows sharing the same getString value into one
      // rowspan-ed cell — only makes sense once rows are sorted by this column
      mergeAdjacent?: boolean;
      // groups runs by this instead of getString — for a column whose display
      // can be blank (e.g. a per-group total hidden for single-row groups),
      // where two unrelated blank rows would otherwise look "equal" and merge
      getMergeKey?: (item: T) => string;
    }
  | {
      type: "copy";
      // opt out of the global search box, e.g. a raw url whose random path segments false-match everything
      searchable?: boolean;
      getString: (item: T) => string;
    }
  | {
      type: "date";
      getDate: (item: T) => Date | undefined;
      // relative time with a hover tooltip for the exact date (default) vs.
      // plain absolute "06/08/2026" — use absolute for dates with no time
      // component, where relative phrasing ("il y a 2 jours") reads oddly
      relative?: boolean;
    }
  | { type: "boolean"; getBoolean: (item: T) => boolean; trueIcon?: HugeIcon }
  | {
      type: "enum";
      enumOptions: Record<string, CustomTableEnumValue>;
      getValue: (item: T) => string | undefined;
      // optional extra detail shown in a popover when the badge is clicked, e.g. a
      // status's timestamp — most enum columns don't need this
      getPopoverContent?: (item: T) => ReactNode;
    }
  | {
      type: "tags";
      getTags: (item: T) => CustomTableEnumValue[];
    }
  | {
      type: "buttons";
      // selectItem is the ready-made "Select" menu item (or null when the
      // table isn't selectable) — passed in so callers can position it
      // wherever it belongs in their own action order, instead of it always
      // being appended last
      getButtons: (item: T, selectItem: ReactNode) => ReactNode;
    }
);

// raw, spreadsheet-friendly value for a column (numeric columns export the
// raw number instead of the formatted string, dates as ISO, enums as their
// underlying key, tags joined by comma)
export function getColumnExportValue<T>(
  column: CustomTableColumn<T>,
  item: T,
): string | number {
  if (column.type === "string") {
    if (column.decimals !== undefined && column.getNumber)
      return column.getNumber(item);
    return column.getString(item);
  }
  if (column.type === "copy") return column.getString(item);
  if (column.type === "date") return column.getDate(item)?.toISOString() ?? "";
  if (column.type === "boolean")
    return column.getBoolean(item) ? "true" : "false";
  if (column.type === "tags")
    return column
      .getTags(item)
      .map((tag) => tag.label)
      .join(", ");
  if (column.type === "buttons") return "";
  return column.getValue(item) ?? "";
}

// plain-text "Label: value" block for every non-button column, in column
// order — meant to be pasted into a chat message, so it uses the same
// rounded, human-readable strings the table cells show (getString/toLocaleDateString)
// rather than the raw unrounded numbers getColumnExportValue produces for spreadsheets
export function buildRowSummary<T>(
  columns: CustomTableColumn<T>[],
  item: T,
  locale = "en-US",
): string {
  return columns
    .filter((column) => column.type !== "buttons")
    .map((column) => {
      const value =
        column.type === "date"
          ? (column.getDate(item)?.toLocaleDateString(locale) ?? "")
          : column.type === "string"
            ? column.getString(item)
            : getColumnExportValue(column, item);
      const suffix =
        column.type === "string" && column.suffix && value !== ""
          ? ` ${column.suffix}`
          : "";
      return `${column.label}: ${value || "-"}${suffix}`;
    })
    .join("\n");
}

// everything the global search box is allowed to match against for one row
function getSearchableStrings<T>(
  columns: CustomTableColumn<T>[],
  item: T,
): string[] {
  return columns.flatMap((column) => {
    if (column.type === "string") return [column.getString(item)];
    if (column.type === "copy")
      return column.searchable === false ? [] : [column.getString(item)];
    if (column.type === "enum") {
      const value = column.getValue(item);
      return value !== undefined
        ? [column.enumOptions[value]?.label ?? ""]
        : [];
    }
    if (column.type === "tags")
      return column.getTags(item).map((tag) => tag.label);
    return [];
  });
}

export function CustomTable<T>({
  items,
  columns,
  getItemId,
  loading,
  selectable,
  filterable = true,
  sortable = true,
  paginate = true,
  searchQueryKey = "q",
  pageQueryKey = "page",
  sortQueryKey = "sort",
  exportFilePrefix = "export",
  onVisibleCountChange,
  defaultSort,
  onDeleteSelected,
  labels: labelOverrides,
}: {
  items: T[];
  columns: CustomTableColumn<T>[];
  getItemId: (item: T) => string;
  loading?: boolean;
  selectable?: boolean;
  // table-wide switches, on top of each column's own type-based eligibility
  filterable?: boolean;
  sortable?: boolean;
  // turn off for short lists where paging just adds a click
  paginate?: boolean;
  // must match the queryKey given to the page's SearchBar
  searchQueryKey?: string;
  // override when a second CustomTable can render on the same page/URL (e.g.
  // one nested in a dialog) so their URL-synced state doesn't collide
  pageQueryKey?: string;
  sortQueryKey?: string;
  exportFilePrefix?: string;
  // reports how many rows survive the current search/filter, e.g. for a "12 results" indicator
  onVisibleCountChange?: (count: number) => void;
  // applied, in order, until one key breaks the tie, only while the user
  // hasn't picked an explicit column sort — doesn't count as an "active
  // sort" for the reset button
  defaultSort?: { columnId: string; dir: "asc" | "desc" }[];
  // enables the bulk-delete action in the selection bar; the table clears
  // its own selection once this resolves without an error
  onDeleteSelected?: (items: T[]) => Promise<{ error: string | null }>;
  // English by default, override the keys you need to localize
  labels?: Partial<CustomTableLabels>;
}) {
  const labels = resolveTableLabels(labelOverrides);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageJumpOpen, setPageJumpOpen] = useState(false);
  const [pageJumpValue, setPageJumpValue] = useState("");
  const [search] = useQueryState(searchQueryKey, { defaultValue: "" });
  const [sortRaw, setSortRaw] = useQueryState(sortQueryKey, {
    defaultValue: "",
  });
  const [page, setPage] = useQueryState(
    pageQueryKey,
    parseAsInteger.withDefault(1),
  );

  const filterParsers = useMemo(
    () =>
      Object.fromEntries(
        filterable
          ? columns.flatMap((column) =>
              getColumnFilterFields(column).map((field) => [
                getFilterKey(column.id, field),
                parseAsString.withDefault(""),
              ]),
            )
          : [],
      ),
    [columns, filterable],
  );
  const [filterValues, setFilterValues] = useQueryStates(filterParsers);

  const getColumnField =
    (columnId: string) =>
    (field: ColumnFilterField): string =>
      filterValues[getFilterKey(columnId, field)] ?? "";
  const setColumnField = (
    columnId: string,
    field: ColumnFilterField,
    value: string,
  ) => setFilterValues({ [getFilterKey(columnId, field)]: value });

  const sort = sortable ? parseSort(sortRaw) : null;
  const hasActiveFilterOrSort =
    Object.values(filterValues).some(Boolean) || sort !== null;
  const resetFilterAndSort = () => {
    setFilterValues(
      Object.fromEntries(Object.keys(filterValues).map((key) => [key, ""])),
    );
    setSortRaw("");
  };

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (
        query &&
        !getSearchableStrings(columns, item).some((s) =>
          s.toLowerCase().includes(query),
        )
      )
        return false;
      if (!filterable) return true;
      return columns.every((column) =>
        columnMatchesFilter(
          column,
          item,
          (field) => filterValues[getFilterKey(column.id, field)] ?? "",
        ),
      );
    });
    if (sort) {
      const sortColumn = columns.find((column) => column.id === sort.columnId);
      if (!sortColumn) return filtered;
      const sorted = [...filtered].sort((a, b) =>
        compareColumnValues(sortColumn, a, b),
      );
      return sort.dir === "desc" ? sorted.reverse() : sorted;
    }
    if (!defaultSort || defaultSort.length === 0) return filtered;
    return [...filtered].sort((a, b) => {
      for (const key of defaultSort) {
        const sortColumn = columns.find((column) => column.id === key.columnId);
        if (!sortColumn) continue;
        const cmp = compareColumnValues(sortColumn, a, b);
        if (cmp !== 0) return key.dir === "desc" ? -cmp : cmp;
      }
      return 0;
    });
  }, [items, columns, search, sort, defaultSort, filterValues, filterable]);

  useEffect(() => {
    onVisibleCountChange?.(visibleItems.length);
  }, [visibleItems, onVisibleCountChange]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: only used to trigger the reset, not read
  useEffect(() => {
    setPage(1);
  }, [search, filterValues, sortRaw, setPage]);

  const pageCount = paginate
    ? Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE))
    : 1;
  const currentPage = Math.min(Math.max(page, 1), pageCount);
  // stable reference across renders — an unmemoized .slice() would return a
  // new array every render, and effects keyed on it (scroll-fade below)
  // would re-fire every render and loop forever
  const paginatedItems = useMemo(
    () =>
      paginate
        ? visibleItems.slice(
            (currentPage - 1) * PAGE_SIZE,
            currentPage * PAGE_SIZE,
          )
        : visibleItems,
    [paginate, visibleItems, currentPage],
  );

  // consecutive-equal runs per mergeAdjacent column, computed over the
  // rendered page only — a run split across a page boundary renders as two
  // merged cells, which is correct given each page is its own <table>
  const mergeRuns = useMemo(() => {
    const runs = new Map<string, { start: boolean; length: number }[]>();
    for (const column of columns) {
      if (column.type !== "string" || !column.mergeAdjacent) continue;
      const getKey = column.getMergeKey ?? column.getString;
      const arr: { start: boolean; length: number }[] = [];
      for (let i = 0; i < paginatedItems.length; i++) {
        if (
          i > 0 &&
          getKey(paginatedItems[i - 1]) === getKey(paginatedItems[i])
        ) {
          arr.push({ start: false, length: 0 });
          continue;
        }
        let length = 1;
        while (
          i + length < paginatedItems.length &&
          getKey(paginatedItems[i + length]) === getKey(paginatedItems[i])
        )
          length++;
        arr.push({ start: true, length });
      }
      runs.set(column.id, arr);
    }
    return runs;
  }, [columns, paginatedItems]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const checkboxColumnRef = useRef<HTMLTableCellElement>(null);
  const [scrollFade, setScrollFade] = useState({ left: 0, right: 0 });
  const [checkboxColumnWidth, setCheckboxColumnWidth] = useState(0);
  // long-press/right-click "Select" turns this on so every row's checkbox
  // shows at once, instead of the user having to open the menu per row —
  // clears itself once nothing is left selected
  const [selectionMode, setSelectionMode] = useState(false);
  useEffect(() => {
    if (selectedIds.size === 0) setSelectionMode(false);
  }, [selectedIds]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: only used to trigger remeasuring after content changes width, not read
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const updateScrollFade = () => {
      const remainingRight =
        scrollContainer.scrollWidth -
        scrollContainer.clientWidth -
        scrollContainer.scrollLeft;
      const left = clampToUnit(scrollContainer.scrollLeft / SCROLL_FADE_SIZE);
      const right = clampToUnit(remainingRight / SCROLL_FADE_SIZE);
      setScrollFade((prev) =>
        prev.left === left && prev.right === right ? prev : { left, right },
      );
      setCheckboxColumnWidth(checkboxColumnRef.current?.offsetWidth ?? 0);
    };

    updateScrollFade();
    scrollContainer.addEventListener("scroll", updateScrollFade);

    // ResizeObserver isn't available on older browsers (e.g. Firefox < 69) —
    // falling back to a window resize listener still catches viewport
    // changes, just not container-only resizes, rather than crashing the effect
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateScrollFade);
      return () => {
        scrollContainer.removeEventListener("scroll", updateScrollFade);
        window.removeEventListener("resize", updateScrollFade);
      };
    }

    const resizeObserver = new ResizeObserver(updateScrollFade);
    resizeObserver.observe(scrollContainer);
    return () => {
      scrollContainer.removeEventListener("scroll", updateScrollFade);
      resizeObserver.disconnect();
    };
  }, [columns, paginatedItems]);

  const toggleRow = (id: string) => {
    haptic("selection");
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // compared against visible rows only — selectedIds can hold ids hidden by
  // the current filter, which would otherwise make this false (and the
  // header checkbox look unchecked) even when every visible row is selected
  const visibleSelectedCount = visibleItems.filter((item) =>
    selectedIds.has(getItemId(item)),
  ).length;
  const allSelected =
    visibleItems.length > 0 && visibleSelectedCount === visibleItems.length;
  const toggleAll = () => {
    haptic("selection");
    const next = new Set(selectedIds);
    for (const item of visibleItems) {
      if (allSelected) next.delete(getItemId(item));
      else next.add(getItemId(item));
    }
    setSelectedIds(next);
  };

  const canResetFilterAndSort =
    (filterable || sortable) && hasActiveFilterOrSort;
  const hasSelection = Boolean(selectable) && selectedIds.size > 0;
  const showActionBar = canResetFilterAndSort || hasSelection || pageCount > 1;

  const selectedItems = items.filter((item) =>
    selectedIds.has(getItemId(item)),
  );

  // the "actions" column is never rendered as a real table column — it's
  // matched by id/type convention and used purely as the row context
  // menu's content, alongside the "Select" item CustomTable adds itself
  const actionsColumn = columns.find(
    (column): column is Extract<CustomTableColumn<T>, { type: "buttons" }> =>
      column.id === "actions" && column.type === "buttons",
  );
  const bodyColumns = columns.filter(
    (column): column is Exclude<CustomTableColumn<T>, { type: "buttons" }> =>
      column.type !== "buttons",
  );
  const hasCheckboxColumn = Boolean(selectable) && selectionMode;
  const hasRowMenu = Boolean(actionsColumn) || Boolean(selectable);
  // overflow-clip on the wrapper doesn't reliably clip position:sticky
  // header cells to its rounded corners (a real Chromium quirk, verified
  // empirically) — corners are rounded on the cells themselves instead, on
  // whichever row is visually first/last. When there are no rows at all,
  // the header row is both
  const isTableEmpty = !loading && paginatedItems.length === 0;
  const leadCheckboxClassName =
    "size-7 rounded-[min(var(--radius-md),12px)] corner-squircle";
  const scrollFadeMask = getScrollFadeMask(
    scrollFade.left,
    scrollFade.right,
    checkboxColumnWidth,
  );

  return (
    <div className="rounded-md overflow-clip">
      {hasRowMenu && (
        <div className="flex items-center justify-center gap-1.5 pb-2 text-xs text-muted-foreground">
          <Icon
            icon={MouseRightClick04Icon}
            className="hidden size-3.5 sm:inline"
          />
          <span className="hidden sm:inline">{labels.rightClickHint}</span>
          <Icon icon={Tap04Icon} className="size-3.5 sm:hidden" />
          <span className="sm:hidden">{labels.longPressHint}</span>
        </div>
      )}
      <div
        ref={scrollContainerRef}
        className="w-full max-h-[calc(100svh-18rem)] overflow-x-auto overflow-y-auto md:max-h-[calc(100svh-14rem)]"
        style={{
          maskImage: scrollFadeMask,
          WebkitMaskImage: scrollFadeMask,
        }}
      >
        <table className="w-full caption-bottom text-sm">
          <TableHeader>
            <TableRow
              className={cn(
                "*:sticky *:top-0 *:outline *:outline-border *:text-center *:text-xs *:bg-muted *:px-4 *:first:rounded-tl-md *:last:rounded-tr-md",
                isTableEmpty && "*:first:rounded-bl-md *:last:rounded-br-md",
              )}
            >
              {hasCheckboxColumn && (
                <TableHead ref={checkboxColumnRef} className="left-0 z-20">
                  <div className="flex justify-center">
                    <Checkbox
                      checked={getTriState(
                        visibleSelectedCount,
                        visibleItems.length,
                      )}
                      onCheckedChange={toggleAll}
                      aria-label={labels.selectAllRows}
                      className={leadCheckboxClassName}
                    />
                  </div>
                </TableHead>
              )}
              {bodyColumns.map((column) => (
                <TableHead key={column.id}>
                  <CustomTableColumnHeader
                    {...{ column, items, filterable, sortable, labels }}
                    getField={getColumnField(column.id)}
                    setField={(field: ColumnFilterField, value: string) =>
                      setColumnField(column.id, field, value)
                    }
                    sort={sort?.columnId === column.id ? sort.dir : null}
                    onSortChange={(dir: "asc" | "desc" | null) =>
                      setSortRaw(
                        dir ? serializeSort({ columnId: column.id, dir }) : "",
                      )
                    }
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              SKELETON_ROW_KEYS.map((key, index) => {
                const skeletonBg =
                  index % 2 === 1
                    ? "bg-[color-mix(in_oklch,var(--background),var(--foreground)_5%)]"
                    : "bg-background";
                const isLastSkeletonRow =
                  index === SKELETON_ROW_KEYS.length - 1;
                return (
                  <TableRow
                    key={key}
                    className={cn(index % 2 === 1 && "bg-foreground/5")}
                  >
                    {hasCheckboxColumn && (
                      <TableCell
                        className={cn(
                          "sticky left-0 z-10 border-r border-border/50",
                          skeletonBg,
                          isLastSkeletonRow && "rounded-bl-md",
                        )}
                      >
                        <div className="flex justify-center pr-2!">
                          <Skeleton className="size-7" />
                        </div>
                      </TableCell>
                    )}
                    {bodyColumns.map((column, columnIndex) => (
                      <TableCell
                        key={column.id}
                        className={cn(
                          "border-r border-border/50 last:border-r-0",
                          isLastSkeletonRow &&
                            columnIndex === 0 &&
                            !hasCheckboxColumn &&
                            "rounded-bl-md",
                          isLastSkeletonRow &&
                            columnIndex === bodyColumns.length - 1 &&
                            "rounded-br-md",
                        )}
                      >
                        <Skeleton className="h-4 w-full min-w-12" />
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            {!loading &&
              paginatedItems.map((item, index) => {
                const id = getItemId(item);
                // a mergeAdjacent column starting a new run here means a new
                // designation group begins — a heavier top border separates
                // it from the previous group, on top of the usual striping
                const isGroupStart =
                  index > 0 &&
                  columns.some(
                    (column) =>
                      column.type === "string" &&
                      column.mergeAdjacent &&
                      mergeRuns.get(column.id)?.[index]?.start,
                  );
                const isSelected = selectedIds.has(id);
                // opaque color-mix instead of a translucent bg-*/N utility —
                // the sticky lead cell paints this same color on itself, and
                // a translucent background there would show other columns
                // sliding underneath it as the table scrolls horizontally
                const rowBackgroundClassName = isSelected
                  ? "bg-[color-mix(in_oklch,var(--background),var(--color-green-500)_15%)]"
                  : index % 2 === 1
                    ? "bg-[color-mix(in_oklch,var(--background),var(--foreground)_5%)]"
                    : "bg-background";
                const isLastDataRow = index === paginatedItems.length - 1;
                const row = (
                  <TableRow
                    key={hasRowMenu ? undefined : id}
                    className={cn(
                      "group/row",
                      rowBackgroundClassName,
                      isGroupStart && "border-t-2 border-t-border",
                    )}
                  >
                    {hasCheckboxColumn && (
                      <TableCell
                        className={cn(
                          "sticky left-0 z-10 border-r border-border/50 text-center",
                          rowBackgroundClassName,
                          isLastDataRow && "rounded-bl-md",
                        )}
                      >
                        <div className="flex justify-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleRow(id)}
                            aria-label={labels.selectRow}
                            className={leadCheckboxClassName}
                          />
                        </div>
                      </TableCell>
                    )}
                    {bodyColumns.map((column, columnIndex) => {
                      const run =
                        column.type === "string" && column.mergeAdjacent
                          ? mergeRuns.get(column.id)?.[index]
                          : undefined;
                      if (run && !run.start) return null;
                      // a merged group's cell rowSpans past this row — the
                      // one actually touching the table's bottom edge is
                      // wherever that span ends, not necessarily this row
                      const isBottomEdgeCell = run?.start
                        ? index + run.length - 1 === paginatedItems.length - 1
                        : isLastDataRow;
                      return (
                        <TableCell
                          key={column.id}
                          rowSpan={run?.start ? run.length : undefined}
                          className={cn(
                            "border-r border-border/50 last:border-r-0",
                            column.type === "string" &&
                              column.align === "right" &&
                              "text-right",
                            (column.type === "copy" ||
                              column.type === "enum" ||
                              column.type === "tags") &&
                              "text-center",
                            isBottomEdgeCell &&
                              columnIndex === 0 &&
                              !hasCheckboxColumn &&
                              "rounded-bl-md",
                            isBottomEdgeCell &&
                              columnIndex === bodyColumns.length - 1 &&
                              "rounded-br-md",
                            run?.start &&
                              run.length > 1 &&
                              "bg-foreground/5! align-middle",
                          )}
                        >
                          <CustomTableCell {...{ column, item, labels }} />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );

                if (!hasRowMenu) return row;

                const selectItem = selectable ? (
                  <ContextMenuItem
                    onSelect={() => {
                      setSelectionMode(true);
                      toggleRow(id);
                    }}
                  >
                    <Icon icon={ICONS.actions} />
                    {labels.selectRow}
                  </ContextMenuItem>
                ) : null;

                return (
                  <RowContextMenu key={id} trigger={row}>
                    {actionsColumn
                      ? actionsColumn.getButtons(item, selectItem)
                      : selectItem}
                  </RowContextMenu>
                );
              })}
          </TableBody>
        </table>
      </div>
      {!loading && visibleItems.length === 0 && (
        <MetaPage
          icon={InboxIcon}
          title={labels.emptyTitle}
          className="border-t border-border"
        />
      )}
      {showActionBar && (
        <div className="fixed inset-x-4 bottom-4 flex flex-col items-end gap-2 sm:inset-x-auto sm:bottom-8 sm:right-8 sm:flex-row border border-border bg-sidebar px-4 py-2 rounded-full corner-squircle shadow-[0_0_16px_rgba(0,0,0,0.35)]">
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
                  <Popover
                    open={pageJumpOpen}
                    onOpenChange={(open) => {
                      setPageJumpOpen(open);
                      if (open) setPageJumpValue(String(currentPage));
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="rounded-sm px-2 text-sm whitespace-nowrap text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {labels.pageOf(currentPage, pageCount)}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto">
                      <form
                        className="flex items-center gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const target = Number(pageJumpValue);
                          if (Number.isInteger(target))
                            setPage(Math.min(Math.max(target, 1), pageCount));
                          setPageJumpOpen(false);
                        }}
                      >
                        <Input
                          type="number"
                          min={1}
                          max={pageCount}
                          autoFocus
                          value={pageJumpValue}
                          onChange={(e) => setPageJumpValue(e.target.value)}
                          className="h-8 w-20"
                        />
                        <Button type="submit" size="sm">
                          {labels.go}
                        </Button>
                      </form>
                    </PopoverContent>
                  </Popover>
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
              onClick={() => {
                setSelectionMode(false);
                setSelectedIds(new Set());
              }}
            >
              <Icon icon={ICONS.cancel} />
              {labels.cancelSelection}
            </Button>
          )}
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
                if (!result.error) setSelectedIds(new Set());
                return result;
              }}
            />
          )}
          {selectable && (
            <ExtractButton
              {...{ selectedItems, columns, labels }}
              filePrefix={exportFilePrefix}
            />
          )}
        </div>
      )}
    </div>
  );
}

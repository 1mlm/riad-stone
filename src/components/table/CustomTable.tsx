"use client";

import {
  InboxIcon,
  MouseRightClick04Icon,
  Tap04Icon,
} from "@hugeicons/core-free-icons";
import { type ReactNode, useEffect } from "react";
import { type HugeIcon, Icon } from "@/components/Icon";
import { MetaPage } from "@/components/MetaPage";
import { Checkbox } from "@/shadcn/ui/checkbox";
import { ContextMenuItem } from "@/shadcn/ui/context-menu";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";
import { cn } from "@/shadcn/utils";
import { ICONS } from "@/utils/icon";
import { CustomTableActionBar } from "./CustomTableActionBar";
import { CustomTableCell } from "./CustomTableCell";
import { CustomTableColumnHeader } from "./CustomTableColumnHeader";
import { CustomTableSkeletonRows } from "./CustomTableSkeletonRows";
import type { ColumnFilterField } from "./filtering";
import { type CustomTableLabels, resolveTableLabels } from "./labels";
import { RowContextMenu } from "./RowContextMenu";
import { useMergeRuns } from "./useMergeRuns";
import { useRowMenuHintState } from "./useRowMenuHintState";
import { useRowSelection } from "./useRowSelection";
import { useScrollFade } from "./useScrollFade";
import { useTableFilterSort } from "./useTableFilterSort";
import { useTablePagination } from "./useTablePagination";

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
  // draws a heavier left border before this column, separating it from the
  // previous group (e.g. sortie-specific columns vs. the entree they refer to)
  dividerBefore?: boolean;
  // fades header + cell to signal "secondary, for context" info, e.g. the
  // entree's own fields shown alongside a sortie's own fields
  dimmed?: boolean;
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

  const {
    visibleItems,
    search,
    sort,
    sortRaw,
    setSort,
    filterValues,
    getColumnField,
    setColumnField,
    hasActiveFilterOrSort,
    resetFilterAndSort,
  } = useTableFilterSort(items, columns, {
    filterable,
    sortable,
    searchQueryKey,
    sortQueryKey,
    defaultSort,
  });

  useEffect(() => {
    onVisibleCountChange?.(visibleItems.length);
  }, [visibleItems, onVisibleCountChange]);

  const { currentPage, setPage, pageCount, paginatedItems } =
    useTablePagination(visibleItems, {
      paginate,
      pageQueryKey,
      resetDeps: [search, filterValues, sortRaw],
    });

  const mergeRuns = useMergeRuns(columns, paginatedItems);

  const {
    selectionMode,
    setSelectionMode,
    toggleRow,
    toggleAll,
    triState,
    selectedItems,
    isSelected,
    clearSelection,
  } = useRowSelection(items, visibleItems, getItemId, Boolean(selectable));

  const { scrollContainerRef, checkboxColumnRef, maskImage } = useScrollFade(
    columns,
    paginatedItems,
  );

  const { shouldShow: showRowMenuHint, recordOpen: recordRowMenuOpen } =
    useRowMenuHintState();

  const canResetFilterAndSort =
    (filterable || sortable) && hasActiveFilterOrSort;

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
  const leadCheckboxClassName =
    "size-7 rounded-[min(var(--radius-md),12px)] corner-squircle";
  // table cells ignore border-radius entirely once the table is
  // border-collapse (the browser default here), so the bottom corners can't
  // round themselves the way the top ones do off the wrapper's own clip —
  // these two patches fake it by painting over the leftover square sliver
  // with the page's own background, in the exact shape carved out of their
  // own corner
  const bottomCornerMaskClassName =
    "pointer-events-none absolute bottom-0 z-20 size-(--radius-concentric) corner-squircle bg-background";

  return (
    <div className="relative rounded-(--radius-concentric) corner-squircle overflow-clip">
      {showRowMenuHint(hasRowMenu) && (
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
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        <table className="w-full caption-bottom text-sm">
          <TableHeader>
            <TableRow className="*:sticky *:top-0 *:outline *:outline-border *:text-center *:text-xs *:bg-muted *:px-4 *:first:rounded-tl-(--radius-concentric) *:last:rounded-tr-(--radius-concentric)">
              {hasCheckboxColumn && (
                <TableHead ref={checkboxColumnRef} className="left-0 z-20">
                  <div className="flex justify-center">
                    <Checkbox
                      checked={triState}
                      onCheckedChange={toggleAll}
                      aria-label={labels.selectAllRows}
                      className={leadCheckboxClassName}
                    />
                  </div>
                </TableHead>
              )}
              {bodyColumns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    column.dividerBefore && "border-l-2 border-l-border",
                    column.dimmed && "opacity-80",
                  )}
                >
                  <CustomTableColumnHeader
                    {...{ column, items, filterable, sortable, labels }}
                    getField={getColumnField(column.id)}
                    setField={(field: ColumnFilterField, value: string) =>
                      setColumnField(column.id, field, value)
                    }
                    sort={sort?.columnId === column.id ? sort.dir : null}
                    onSortChange={(dir: "asc" | "desc" | null) =>
                      setSort(dir ? { columnId: column.id, dir } : null)
                    }
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <CustomTableSkeletonRows
                {...{ bodyColumns, hasCheckboxColumn }}
              />
            )}
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
                const selected = isSelected(id);
                // opaque color-mix instead of a translucent bg-*/N utility —
                // the sticky lead cell paints this same color on itself, and
                // a translucent background there would show other columns
                // sliding underneath it as the table scrolls horizontally
                const rowBackgroundClassName = selected
                  ? "bg-[color-mix(in_oklch,var(--background),var(--color-green-500)_15%)]"
                  : index % 2 === 1
                    ? "bg-[color-mix(in_oklch,var(--background),var(--foreground)_5%)]"
                    : "bg-background";
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
                        )}
                      >
                        <div className="flex justify-center">
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => toggleRow(id)}
                            aria-label={labels.selectRow}
                            className={leadCheckboxClassName}
                          />
                        </div>
                      </TableCell>
                    )}
                    {bodyColumns.map((column) => {
                      const run =
                        column.type === "string" && column.mergeAdjacent
                          ? mergeRuns.get(column.id)?.[index]
                          : undefined;
                      if (run && !run.start) return null;
                      return (
                        <TableCell
                          key={column.id}
                          rowSpan={run?.start ? run.length : undefined}
                          className={cn(
                            "border-r border-border/50 last:border-r-0",
                            column.dividerBefore &&
                              "border-l-2 border-l-border",
                            column.dimmed && "opacity-80",
                            column.type === "string" &&
                              column.align === "right" &&
                              "text-right",
                            (column.type === "copy" ||
                              column.type === "enum" ||
                              column.type === "tags") &&
                              "text-center",
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
                  <RowContextMenu
                    key={id}
                    trigger={row}
                    onOpen={recordRowMenuOpen}
                  >
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
      <CustomTableActionBar
        {...{
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
        }}
      />
      <div
        aria-hidden
        className={cn(bottomCornerMaskClassName, "left-0 rounded-tr-full")}
      />
      <div
        aria-hidden
        className={cn(bottomCornerMaskClassName, "right-0 rounded-tl-full")}
      />
    </div>
  );
}

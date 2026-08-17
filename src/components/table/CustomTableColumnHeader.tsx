"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { cn } from "@/shadcn/utils";
import { ICONS } from "@/utils/icon";
import { BooleanFilterContent } from "./BooleanFilterContent";
import type { CustomTableColumn } from "./CustomTable";
import { DateRangeFilterContent } from "./DateRangeFilterContent";
import { EnumFilterContent } from "./EnumFilterContent";
import {
  type ColumnFilterField,
  type GetFilterField,
  getColumnFilterFields,
  isColumnFilterableOrSortable,
} from "./filtering";
import { getSortIcon } from "./getSortIcon";
import { LengthRangeFilterContent } from "./LengthRangeFilterContent";
import type { CustomTableLabels } from "./labels";
import { NumberRangeFilterContent } from "./NumberRangeFilterContent";
import { SortSubmenuContent } from "./SortSubmenuContent";
import { TagsFilterContent } from "./TagsFilterContent";
import { TextFilterContent } from "./TextFilterContent";

export function CustomTableColumnHeader<T>({
  column,
  items,
  filterable = true,
  sortable = true,
  getField,
  setField,
  sort,
  onSortChange,
  labels,
}: {
  column: CustomTableColumn<T>;
  items: T[];
  filterable?: boolean;
  sortable?: boolean;
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
  sort: "asc" | "desc" | null;
  onSortChange: (dir: "asc" | "desc" | null) => void;
  labels: CustomTableLabels;
}) {
  const [view, setView] = useState<"root" | "filter" | "sort">("root");
  const columnEligible = isColumnFilterableOrSortable(column);
  const canFilter = filterable && columnEligible;
  const canSort = sortable && columnEligible;
  const fields = getColumnFilterFields(column);
  const hasActiveFilter = canFilter && fields.some((field) => getField(field));
  const numeric =
    column.type === "string" &&
    (column.filterType === "number" || column.filterType === "length");
  const unitSuffix = column.type === "string" ? column.suffix : undefined;

  const label = (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1.5",
        (canFilter || canSort) && "transition-colors hover:text-foreground/70",
      )}
    >
      <Icon icon={column.icon} />
      {column.label}
      {unitSuffix && (
        <span className="font-mono text-[0.8em] opacity-70">
          ({unitSuffix})
        </span>
      )}
      {hasActiveFilter && (
        <Icon
          icon={ICONS.filter}
          fill="currentColor"
          className="size-3 text-primary"
        />
      )}
      {sort && (
        <Icon
          icon={getSortIcon(sort, numeric)}
          className="size-3 text-primary"
        />
      )}
    </span>
  );

  if (!canFilter && !canSort)
    return <span className="inline-flex">{label}</span>;

  // a flyout sub-menu (side="right") has nowhere to go on a narrow mobile
  // viewport — Radix's Sub only flips right/left, and near a screen edge
  // both options overflow. Drilling into filter/sort content in place,
  // inside the same already-correctly-positioned DropdownMenuContent,
  // sidesteps that positioning problem entirely instead of fighting it
  const isFilterWide =
    column.type !== "string" && column.type !== "tags"
      ? true
      : column.type === "string" && column.filterType === "length";

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) setView("root");
      }}
    >
      <DropdownMenuTrigger>{label}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        className={cn(
          "w-40",
          view === "filter" && isFilterWide && "w-56",
          view !== "root" && "max-w-[calc(100vw-2rem)]",
        )}
      >
        {view === "root" && (
          <>
            {canFilter && (
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setView("filter");
                }}
              >
                <Icon icon={ICONS.filter} />
                {labels.filter}
              </DropdownMenuItem>
            )}
            {canSort && (
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setView("sort");
                }}
              >
                <Icon icon={ICONS.sort} />
                {labels.sort}
              </DropdownMenuItem>
            )}
          </>
        )}
        {view === "filter" && (
          <>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setView("root");
              }}
            >
              <Icon icon={ICONS.chevronLeft} />
              {labels.filter}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {column.type === "enum" && (
              <EnumFilterContent {...{ column, getField, setField, labels }} />
            )}
            {column.type === "date" && (
              <DateRangeFilterContent {...{ getField, setField, labels }} />
            )}
            {column.type === "string" && column.filterType === "number" && (
              <NumberRangeFilterContent {...{ getField, setField, labels }} />
            )}
            {column.type === "string" && column.filterType === "length" && (
              <LengthRangeFilterContent {...{ getField, setField, labels }} />
            )}
            {column.type === "string" &&
              column.filterType !== "number" &&
              column.filterType !== "length" && (
                <TextFilterContent {...{ getField, setField, labels }} />
              )}
            {column.type === "tags" && (
              <TagsFilterContent
                {...{ column, items, getField, setField, labels }}
              />
            )}
            {column.type === "boolean" && (
              <BooleanFilterContent {...{ getField, setField, labels }} />
            )}
            {hasActiveFilter && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    for (const field of fields) setField(field, "");
                  }}
                >
                  <Icon icon={ICONS.cancel} />
                  {labels.cancel}
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
        {view === "sort" && (
          <>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setView("root");
              }}
            >
              <Icon icon={ICONS.chevronLeft} />
              {labels.sort}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <SortSubmenuContent {...{ numeric, sort, onSortChange, labels }} />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { type ReactNode, useId, useState } from "react";
import { Icon } from "@/components/Icon";
import { UnitDropdown } from "@/components/UnitDropdown";
import { Button } from "@/shadcn/ui/button";
import { Calendar } from "@/shadcn/ui/calendar";
import { Checkbox } from "@/shadcn/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { Input } from "@/shadcn/ui/input";
import { cn } from "@/shadcn/utils";
import { haptic } from "@/utils/haptics";
import { ICONS } from "@/utils/icon";
import { type LengthUnit, lengthToMeters, metersToUnit } from "@/utils/length";
import type { CustomTableColumn } from "./CustomTable";
import { EnumBadge } from "./CustomTableCell";
import {
  type ColumnFilterField,
  DAY_MS,
  ENUM_FILTER_NONE_KEY,
  type GetFilterField,
  getColumnFilterFields,
  getTriState,
  isColumnFilterableOrSortable,
  isEnumOptionExcluded,
  toggleEnumOption,
} from "./filtering";
import type { CustomTableLabels } from "./labels";

// one consistent checkbox+label row, reused by every filter menu (enum options, "select all", tag picks...)
function CheckboxRow({
  checked,
  onCheckedChange,
  children,
}: {
  checked: boolean | "indeterminate";
  onCheckedChange: () => void;
  children: ReactNode;
}) {
  const id = useId();

  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
    >
      <Checkbox
        {...{ id, checked }}
        onCheckedChange={() => {
          haptic("selection");
          onCheckedChange();
        }}
      />
      {children}
    </label>
  );
}

function SelectAllRow({
  selectedCount,
  totalCount,
  onToggle,
  labels,
}: {
  selectedCount: number;
  totalCount: number;
  onToggle: () => void;
  labels: CustomTableLabels;
}) {
  return (
    <CheckboxRow
      checked={getTriState(selectedCount, totalCount)}
      onCheckedChange={onToggle}
    >
      {labels.selectAll}
    </CheckboxRow>
  );
}

// two number inputs sharing one min/max filter pair
function MinMaxInputs({
  getField,
  setField,
  minField = "min",
  maxField = "max",
  className = "h-7 w-20",
  showToLabel = false,
  labels,
}: {
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
  minField?: ColumnFilterField;
  maxField?: ColumnFilterField;
  className?: string;
  showToLabel?: boolean;
  labels: CustomTableLabels;
}) {
  return (
    <>
      <Input
        type="number"
        placeholder={labels.min}
        value={getField(minField)}
        onChange={(e) => setField(minField, e.target.value)}
        {...{ className }}
      />
      {showToLabel && (
        <span className="text-muted-foreground text-xs">{labels.to}</span>
      )}
      <Input
        type="number"
        placeholder={labels.max}
        value={getField(maxField)}
        onChange={(e) => setField(maxField, e.target.value)}
        {...{ className }}
      />
    </>
  );
}

function EnumFilterContent<T>({
  column,
  getField,
  setField,
  labels,
}: {
  column: Extract<CustomTableColumn<T>, { type: "enum" }>;
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
  labels: CustomTableLabels;
}) {
  const options = Object.entries(column.enumOptions);
  const allKeys = [...options.map(([key]) => key), ENUM_FILTER_NONE_KEY];
  const toggle = (key: string) =>
    setField("excluded", toggleEnumOption(getField, key));

  const includedCount = allKeys.filter(
    (key) => !isEnumOptionExcluded(getField, key),
  ).length;
  const toggleAll = () =>
    setField(
      "excluded",
      includedCount === allKeys.length ? allKeys.join(",") : "",
    );

  return (
    <div className="flex flex-col gap-1 p-1">
      <SelectAllRow
        selectedCount={includedCount}
        totalCount={allKeys.length}
        onToggle={toggleAll}
        {...{ labels }}
      />
      <DropdownMenuSeparator />
      {options.map(([key, value]) => (
        <CheckboxRow
          key={key}
          checked={!isEnumOptionExcluded(getField, key)}
          onCheckedChange={() => toggle(key)}
        >
          <EnumBadge {...{ value }} />
        </CheckboxRow>
      ))}
      <CheckboxRow
        checked={!isEnumOptionExcluded(getField, ENUM_FILTER_NONE_KEY)}
        onCheckedChange={() => toggle(ENUM_FILTER_NONE_KEY)}
      >
        <Icon icon={ICONS.cancel} className="size-3.5 opacity-50" />
        <span className="text-sm">{labels.noValue}</span>
      </CheckboxRow>
    </div>
  );
}

// same "excluded" toggle mechanism as the enum filter, fixed to the two keys "true"/"false"
function BooleanFilterContent({
  getField,
  setField,
  labels,
}: {
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
  labels: CustomTableLabels;
}) {
  const keys = ["true", "false"];
  const toggle = (key: string) =>
    setField("excluded", toggleEnumOption(getField, key));
  const includedCount = keys.filter(
    (key) => !isEnumOptionExcluded(getField, key),
  ).length;
  const toggleAll = () =>
    setField("excluded", includedCount === keys.length ? keys.join(",") : "");

  return (
    <div className="flex flex-col gap-1 p-1">
      <SelectAllRow
        selectedCount={includedCount}
        totalCount={keys.length}
        onToggle={toggleAll}
        {...{ labels }}
      />
      <DropdownMenuSeparator />
      <CheckboxRow
        checked={!isEnumOptionExcluded(getField, "true")}
        onCheckedChange={() => toggle("true")}
      >
        <Icon icon={ICONS.check} className="size-3.5 text-green-500" />
        <span className="text-sm">{labels.yes}</span>
      </CheckboxRow>
      <CheckboxRow
        checked={!isEnumOptionExcluded(getField, "false")}
        onCheckedChange={() => toggle("false")}
      >
        <Icon icon={ICONS.cancel} className="size-3.5 opacity-50" />
        <span className="text-sm">{labels.no}</span>
      </CheckboxRow>
    </div>
  );
}

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

// stable ids so a caller can override just one preset's label without
// redefining the range logic — the range math never needs localizing
const getDatePresets = (
  labels: CustomTableLabels,
): { label: string; getRange: () => [Date, Date] }[] => [
  {
    label: labels.lastHour,
    getRange: () => [new Date(Date.now() - 3_600_000), new Date()],
  },
  {
    label: labels.today,
    getRange: () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return [start, new Date()];
    },
  },
  {
    label: labels.yesterday,
    getRange: () => {
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + DAY_MS - 1);
      return [start, end];
    },
  },
  {
    label: labels.thisWeek,
    getRange: () => {
      const start = new Date();
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      start.setHours(0, 0, 0, 0);
      return [start, new Date()];
    },
  },
  {
    label: labels.thisMonth,
    getRange: () => [
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      new Date(),
    ],
  },
];

function DateRangeFilterContent({
  getField,
  setField,
  labels,
}: {
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
  labels: CustomTableLabels;
}) {
  const from = getField("from");
  const to = getField("to");
  const datePresets = getDatePresets(labels);

  return (
    <div className="flex flex-col gap-1 p-1">
      <div className="flex flex-wrap gap-1 px-1 pb-1">
        {datePresets.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => {
              haptic("selection");
              const [start, end] = preset.getRange();
              setField("from", start.toISOString());
              setField("to", end.toISOString());
            }}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <Calendar
        mode="range"
        selected={{
          from: from ? new Date(from) : undefined,
          to: to ? new Date(to) : undefined,
        }}
        onSelect={(range) => {
          haptic("selection");
          setField("from", range?.from ? toDateInputValue(range.from) : "");
          setField("to", range?.to ? toDateInputValue(range.to) : "");
        }}
      />
    </div>
  );
}

function NumberRangeFilterContent({
  getField,
  setField,
  labels,
}: {
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
  labels: CustomTableLabels;
}) {
  return (
    <div className="flex items-center gap-1.5 p-2">
      <MinMaxInputs {...{ getField, setField, labels }} showToLabel />
    </div>
  );
}

// same min/max pair as NumberRangeFilterContent, but with a unit dropdown —
// the stored min/max stay in the column's own unit (cm), only the displayed
// digits get converted as the user switches units
function LengthRangeFilterContent({
  getField,
  setField,
  labels,
}: {
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
  labels: CustomTableLabels;
}) {
  const [unit, setUnit] = useState<LengthUnit>("cm");

  const toDisplay = (storedCm: string) =>
    storedCm ? String(metersToUnit(Number(storedCm) / 100, unit)) : "";
  const toStoredCm = (displayValue: string) =>
    displayValue
      ? String(lengthToMeters(Number(displayValue), unit) * 100)
      : "";

  return (
    <div className="flex flex-col gap-1.5 p-2">
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground text-xs">{labels.between}</span>
        <Input
          type="number"
          placeholder={labels.min}
          value={toDisplay(getField("min"))}
          onChange={(e) => setField("min", toStoredCm(e.target.value))}
          className="h-7 w-16"
        />
        <span className="text-muted-foreground text-xs">{labels.and}</span>
        <Input
          type="number"
          placeholder={labels.max}
          value={toDisplay(getField("max"))}
          onChange={(e) => setField("max", toStoredCm(e.target.value))}
          className="h-7 w-16"
        />
      </div>
      <UnitDropdown {...{ unit }} onUnitChange={setUnit} />
    </div>
  );
}

function TextFilterContent({
  getField,
  setField,
  labels,
}: {
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
  labels: CustomTableLabels;
}) {
  return (
    <div className="p-2">
      <Input
        placeholder={labels.search}
        value={getField("search")}
        onChange={(e) => setField("search", e.target.value)}
        className="h-7"
      />
    </div>
  );
}

function TagsFilterContent<T>({
  column,
  items,
  getField,
  setField,
  labels,
}: {
  column: Extract<CustomTableColumn<T>, { type: "tags" }>;
  items: T[];
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
  labels: CustomTableLabels;
}) {
  const only = getField("only")
    ? getField("only").split(",").filter(Boolean)
    : [];
  const allLabels = [
    ...new Set(
      items.flatMap((item) => column.getTags(item).map((tag) => tag.label)),
    ),
  ];
  const toggleAll = () =>
    setField(
      "only",
      only.length === allLabels.length ? "" : allLabels.join(","),
    );
  const toggleLabel = (label: string) => {
    const next = only.includes(label)
      ? only.filter((value) => value !== label)
      : [...only, label];
    setField("only", next.join(","));
  };

  return (
    <div className="flex flex-col gap-1 p-1">
      <div className="flex items-center gap-1.5 p-1">
        <span className="text-muted-foreground text-xs">{labels.count}</span>
        <MinMaxInputs
          {...{ getField, setField, labels }}
          minField="countMin"
          maxField="countMax"
          className="h-7 w-16"
        />
      </div>
      <DropdownMenuSeparator />
      <div className="p-1">
        <Input
          placeholder={labels.searchTags}
          value={getField("search")}
          onChange={(e) => setField("search", e.target.value)}
          className="h-7"
        />
      </div>
      <DropdownMenuSeparator />
      <SelectAllRow
        selectedCount={only.length}
        totalCount={allLabels.length}
        onToggle={toggleAll}
        {...{ labels }}
      />
      <DropdownMenuSeparator />
      <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto p-1">
        {allLabels.map((label) => (
          <CheckboxRow
            key={label}
            checked={only.includes(label)}
            onCheckedChange={() => toggleLabel(label)}
          >
            {label}
          </CheckboxRow>
        ))}
      </div>
    </div>
  );
}

// numeric columns sort with a 1-9/9-1 icon, everything else with an A-Z/Z-A
// icon — both pairs come from the same "Sorting" icon family so they read as
// one consistent visual language instead of mixing arrow and sorting glyphs
const getSortIcon = (dir: "asc" | "desc", numeric: boolean) =>
  dir === "asc"
    ? numeric
      ? ICONS.increasingNumber
      : ICONS.increasingText
    : numeric
      ? ICONS.decreasingNumber
      : ICONS.decreasingText;

function SortSubmenuContent({
  numeric,
  sort,
  onSortChange,
  labels,
}: {
  numeric: boolean;
  sort: "asc" | "desc" | null;
  onSortChange: (dir: "asc" | "desc" | null) => void;
  labels: CustomTableLabels;
}) {
  return (
    <>
      <DropdownMenuItem onClick={() => onSortChange("asc")}>
        <Icon icon={getSortIcon("asc", numeric)} />
        {labels.ascending}
        {sort === "asc" && (
          <span className="ml-auto text-muted-foreground text-xs">✓</span>
        )}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onSortChange("desc")}>
        <Icon icon={getSortIcon("desc", numeric)} />
        {labels.descending}
        {sort === "desc" && (
          <span className="ml-auto text-muted-foreground text-xs">✓</span>
        )}
      </DropdownMenuItem>
      {sort && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onSortChange(null)}>
            <Icon icon={ICONS.cancel} />
            {labels.cancel}
          </DropdownMenuItem>
        </>
      )}
    </>
  );
}

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>{label}</DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-40">
        {canFilter && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icon icon={ICONS.filter} />
              {labels.filter}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                className={cn(
                  column.type !== "string" && column.type !== "tags" && "w-56",
                  column.type === "string" &&
                    column.filterType === "length" &&
                    "w-56",
                )}
              >
                {column.type === "enum" && (
                  <EnumFilterContent
                    {...{ column, getField, setField, labels }}
                  />
                )}
                {column.type === "date" && (
                  <DateRangeFilterContent {...{ getField, setField, labels }} />
                )}
                {column.type === "string" && column.filterType === "number" && (
                  <NumberRangeFilterContent
                    {...{ getField, setField, labels }}
                  />
                )}
                {column.type === "string" && column.filterType === "length" && (
                  <LengthRangeFilterContent
                    {...{ getField, setField, labels }}
                  />
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
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        )}
        {canSort && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icon icon={ICONS.sort} />
              {labels.sort}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <SortSubmenuContent
                  {...{ numeric, sort, onSortChange, labels }}
                />
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

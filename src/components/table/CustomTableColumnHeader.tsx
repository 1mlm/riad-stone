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
      <Checkbox {...{ id, checked, onCheckedChange }} />
      {children}
    </label>
  );
}

function SelectAllRow({
  selectedCount,
  totalCount,
  onToggle,
}: {
  selectedCount: number;
  totalCount: number;
  onToggle: () => void;
}) {
  return (
    <CheckboxRow
      checked={getTriState(selectedCount, totalCount)}
      onCheckedChange={onToggle}
    >
      Tout sélectionner
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
}: {
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
  minField?: ColumnFilterField;
  maxField?: ColumnFilterField;
  className?: string;
  showToLabel?: boolean;
}) {
  return (
    <>
      <Input
        type="number"
        placeholder="Min"
        value={getField(minField)}
        onChange={(e) => setField(minField, e.target.value)}
        {...{ className }}
      />
      {showToLabel && <span className="text-muted-foreground text-xs">to</span>}
      <Input
        type="number"
        placeholder="Max"
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
}: {
  column: Extract<CustomTableColumn<T>, { type: "enum" }>;
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
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
        <span className="text-sm">Aucune valeur</span>
      </CheckboxRow>
    </div>
  );
}

// same "excluded" toggle mechanism as the enum filter, fixed to the two keys "true"/"false"
function BooleanFilterContent({
  getField,
  setField,
}: {
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
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
      />
      <DropdownMenuSeparator />
      <CheckboxRow
        checked={!isEnumOptionExcluded(getField, "true")}
        onCheckedChange={() => toggle("true")}
      >
        <Icon icon={ICONS.check} className="size-3.5 text-green-500" />
        <span className="text-sm">Oui</span>
      </CheckboxRow>
      <CheckboxRow
        checked={!isEnumOptionExcluded(getField, "false")}
        onCheckedChange={() => toggle("false")}
      >
        <Icon icon={ICONS.cancel} className="size-3.5 opacity-50" />
        <span className="text-sm">Non</span>
      </CheckboxRow>
    </div>
  );
}

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

const DATE_PRESETS: { label: string; getRange: () => [Date, Date] }[] = [
  {
    label: "Dernière heure",
    getRange: () => [new Date(Date.now() - 3_600_000), new Date()],
  },
  {
    label: "Aujourd'hui",
    getRange: () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return [start, new Date()];
    },
  },
  {
    label: "Hier",
    getRange: () => {
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + DAY_MS - 1);
      return [start, end];
    },
  },
  {
    label: "Cette semaine",
    getRange: () => {
      const start = new Date();
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      start.setHours(0, 0, 0, 0);
      return [start, new Date()];
    },
  },
  {
    label: "Ce mois-ci",
    getRange: () => [
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      new Date(),
    ],
  },
];

function DateRangeFilterContent({
  getField,
  setField,
}: {
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
}) {
  const from = getField("from");
  const to = getField("to");

  return (
    <div className="flex flex-col gap-1 p-1">
      <div className="flex flex-wrap gap-1 px-1 pb-1">
        {DATE_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => {
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
          setField("from", range?.from ? toDateInputValue(range.from) : "");
          setField("to", range?.to ? toDateInputValue(range.to) : "");
        }}
      />
      {(from || to) && (
        <Button
          variant="ghost"
          size="sm"
          className="justify-start"
          onClick={() => {
            setField("from", "");
            setField("to", "");
          }}
        >
          <Icon icon={ICONS.cancel} />
          Effacer
        </Button>
      )}
    </div>
  );
}

function NumberRangeFilterContent({
  getField,
  setField,
}: {
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 p-2">
      <MinMaxInputs {...{ getField, setField }} showToLabel />
    </div>
  );
}

// same min/max pair as NumberRangeFilterContent, but with a unit dropdown —
// the stored min/max stay in the column's own unit (cm), only the displayed
// digits get converted as the user switches units
function LengthRangeFilterContent({
  getField,
  setField,
}: {
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
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
        <span className="text-muted-foreground text-xs">Entre</span>
        <Input
          type="number"
          placeholder="Min"
          value={toDisplay(getField("min"))}
          onChange={(e) => setField("min", toStoredCm(e.target.value))}
          className="h-7 w-16"
        />
        <span className="text-muted-foreground text-xs">et</span>
        <Input
          type="number"
          placeholder="Max"
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
}: {
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
}) {
  return (
    <div className="p-2">
      <Input
        placeholder="Rechercher..."
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
}: {
  column: Extract<CustomTableColumn<T>, { type: "tags" }>;
  items: T[];
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
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
        <span className="text-muted-foreground text-xs">Nombre</span>
        <MinMaxInputs
          {...{ getField, setField }}
          minField="countMin"
          maxField="countMax"
          className="h-7 w-16"
        />
      </div>
      <DropdownMenuSeparator />
      <div className="p-1">
        <Input
          placeholder="Rechercher des tags..."
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
}: {
  numeric: boolean;
  sort: "asc" | "desc" | null;
  onSortChange: (dir: "asc" | "desc" | null) => void;
}) {
  return (
    <>
      <DropdownMenuItem onClick={() => onSortChange("asc")}>
        <Icon icon={getSortIcon("asc", numeric)} />
        Croissant
        {sort === "asc" && (
          <span className="ml-auto text-muted-foreground text-xs">✓</span>
        )}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onSortChange("desc")}>
        <Icon icon={getSortIcon("desc", numeric)} />
        Décroissant
        {sort === "desc" && (
          <span className="ml-auto text-muted-foreground text-xs">✓</span>
        )}
      </DropdownMenuItem>
      {sort && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onSortChange(null)}>
            <Icon icon={ICONS.cancel} />
            Annuler
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
}: {
  column: CustomTableColumn<T>;
  items: T[];
  filterable?: boolean;
  sortable?: boolean;
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
  sort: "asc" | "desc" | null;
  onSortChange: (dir: "asc" | "desc" | null) => void;
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
      <DropdownMenuTrigger asChild>
        <button type="button">{label}</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-40">
        {canFilter && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icon icon={ICONS.filter} />
              Filtrer
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
                  <EnumFilterContent {...{ column, getField, setField }} />
                )}
                {column.type === "date" && (
                  <DateRangeFilterContent {...{ getField, setField }} />
                )}
                {column.type === "string" && column.filterType === "number" && (
                  <NumberRangeFilterContent {...{ getField, setField }} />
                )}
                {column.type === "string" && column.filterType === "length" && (
                  <LengthRangeFilterContent {...{ getField, setField }} />
                )}
                {column.type === "string" &&
                  column.filterType !== "number" &&
                  column.filterType !== "length" && (
                    <TextFilterContent {...{ getField, setField }} />
                  )}
                {column.type === "tags" && (
                  <TagsFilterContent
                    {...{ column, items, getField, setField }}
                  />
                )}
                {column.type === "boolean" && (
                  <BooleanFilterContent {...{ getField, setField }} />
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
                      Annuler
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
              Trier
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <SortSubmenuContent {...{ numeric, sort, onSortChange }} />
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

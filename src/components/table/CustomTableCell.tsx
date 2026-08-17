"use client";

import { CheckIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { cn } from "@/shadcn/utils";
import { AlignedNumber } from "./AlignedNumber";
import { CopyButton } from "./CopyButton";
import type { CustomTableColumn } from "./CustomTable";
import { CustomTableEmptyValue } from "./CustomTableEmptyValue";
import { DateCell } from "./DateCell";
import { EnumBadge } from "./EnumBadge";
import type { CustomTableLabels } from "./labels";
import { MiddleTruncatedText } from "./MiddleTruncatedText";
import { TagsCell } from "./TagsCell";

function renderStringContent<T>(
  column: Extract<CustomTableColumn<T>, { type: "string" }>,
  item: T,
  value: string,
) {
  if (column.decimals !== undefined && column.getNumber)
    return (
      <AlignedNumber
        value={column.getNumber(item)}
        decimals={column.decimals}
      />
    );
  if (column.truncate === "middle")
    return <MiddleTruncatedText {...{ value }} monospace={column.monospace} />;
  return (
    <span className={cn(column.monospace && "font-mono text-xs")}>{value}</span>
  );
}

export function CustomTableCell<T>({
  column,
  item,
  labels,
}: {
  // the "buttons" column is never rendered as a real table cell — CustomTable
  // filters it out of bodyColumns before mapping over CustomTableCell, since
  // it's matched by id/type convention and used purely as the row context
  // menu's content instead
  column: Exclude<CustomTableColumn<T>, { type: "buttons" }>;
  item: T;
  labels: CustomTableLabels;
}) {
  if (column.type === "string") {
    const value = column.getString(item);
    if (!value) return <CustomTableEmptyValue />;
    const content = renderStringContent(column, item, value);
    if (!column.onClick) return content;
    return (
      <button
        type="button"
        onClick={() => column.onClick?.(item)}
        className="cursor-pointer hover:underline underline-offset-2"
      >
        {content}
      </button>
    );
  }
  if (column.type === "copy") {
    return <CopyButton value={column.getString(item)} />;
  }
  if (column.type === "date")
    return (
      <DateCell
        date={column.getDate(item)}
        relative={column.relative}
        timestampLabel={labels.timestamp}
      />
    );
  if (column.type === "boolean") {
    return column.getBoolean(item) ? (
      <div className="flex justify-center">
        <Icon icon={column.trueIcon ?? CheckIcon} className="text-green-500" />
      </div>
    ) : (
      <CustomTableEmptyValue />
    );
  }

  if (column.type === "enum") {
    const value = column.getValue(item);
    const enumValue =
      value !== undefined ? column.enumOptions[value] : undefined;
    if (!enumValue) return <CustomTableEmptyValue />;
    const popoverContent = column.getPopoverContent?.(item);
    if (!popoverContent) return <EnumBadge value={enumValue} />;
    return (
      <Popover>
        <PopoverTrigger className="cursor-pointer">
          <EnumBadge value={enumValue} />
        </PopoverTrigger>
        <PopoverContent className="w-auto">{popoverContent}</PopoverContent>
      </Popover>
    );
  }

  const tags = column.getTags(item);
  if (tags.length === 0) return <CustomTableEmptyValue />;
  return <TagsCell {...{ tags }} itemLabel={column.label.toLowerCase()} />;
}

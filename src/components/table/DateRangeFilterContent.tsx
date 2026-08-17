import { Button } from "@/shadcn/ui/button";
import { Calendar } from "@/shadcn/ui/calendar";
import { haptic } from "@/utils/haptics";
import {
  type ColumnFilterField,
  DAY_MS,
  type GetFilterField,
} from "./filtering";
import type { CustomTableLabels } from "./labels";

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

export function DateRangeFilterContent({
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

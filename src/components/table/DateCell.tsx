import {
  Calendar04Icon,
  Clock01Icon,
  CodeIcon,
  Forward02Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import {
  formatDetailedDuration,
  formatExactDate,
  formatRelativeDate,
  formatShortDate,
} from "@/utils/date";
import { CustomTableEmptyValue } from "./CustomTableEmptyValue";

export function DateCell({
  date,
  relative = true,
  timestampLabel = "Timestamp: ",
}: {
  date: Date | undefined;
  relative?: boolean;
  timestampLabel?: string;
}) {
  if (!date) return <CustomTableEmptyValue />;

  if (!relative)
    return <span className="font-normal">{formatShortDate(date)}</span>;

  return (
    <span className="font-normal italic inline-flex items-center gap-2 group/date">
      {formatRelativeDate(date)}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="opacity-0 group-hover/date:opacity-100 focus-visible:opacity-100 transition-opacity"
          >
            <Icon icon={Clock01Icon} className="size-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent sideOffset={6} className="flex-col items-start gap-1">
          <span className="inline-flex items-center gap-1.5">
            <Icon icon={Calendar04Icon} />
            {formatExactDate(date)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon icon={Forward02Icon} />
            {formatDetailedDuration(date)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon icon={CodeIcon} />
            <span className="font-semibold">{timestampLabel}</span>
            {date.getTime()}
          </span>
        </TooltipContent>
      </Tooltip>
    </span>
  );
}

import { Icon } from "@/components/Icon";
import { Badge } from "@/shadcn/ui/badge";
import { cn } from "@/shadcn/utils";
import { getColorStyle } from "@/utils/color";
import type { CustomTableEnumValue } from "./CustomTable";

export function EnumBadge({ value }: { value: CustomTableEnumValue }) {
  const badge = (
    <Badge
      style={getColorStyle(value.color)}
      className={cn(
        "shadow-sm text-shadow-2xs text-shadow-black/2",
        value.onClick && "cursor-pointer hover:underline underline-offset-2",
      )}
    >
      <Icon icon={value.icon} />
      {value.label}
    </Badge>
  );
  if (!value.onClick) return badge;
  return (
    <button type="button" onClick={value.onClick}>
      {badge}
    </button>
  );
}

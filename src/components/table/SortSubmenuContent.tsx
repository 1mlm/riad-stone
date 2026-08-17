import { Icon } from "@/components/Icon";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/shadcn/ui/dropdown-menu";
import { ICONS } from "@/utils/icon";
import { getSortIcon } from "./getSortIcon";
import type { CustomTableLabels } from "./labels";

export function SortSubmenuContent({
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

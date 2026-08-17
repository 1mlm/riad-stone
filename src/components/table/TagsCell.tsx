import { FullScreenIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { cn } from "@/shadcn/utils";
import type { CustomTableEnumValue } from "./CustomTable";
import { EnumBadge } from "./EnumBadge";

export function TagsCell({
  tags,
  itemLabel,
}: {
  tags: CustomTableEnumValue[];
  itemLabel: string;
}) {
  const hasOverflow = tags.length > 2;

  return (
    <Dialog>
      <div className="relative">
        <div
          className={cn(
            "flex max-h-11 flex-wrap justify-center gap-1 overflow-hidden",
            hasOverflow && "max-h-14 mask-b-from-60%",
          )}
        >
          {tags.map((tag) => (
            <EnumBadge key={tag.label} value={tag} />
          ))}
        </div>
        {hasOverflow && (
          <DialogTrigger asChild>
            <button
              type="button"
              className="absolute -top-2 -right-1 inline-flex items-center gap-1 rounded-full bg-popover px-1.5 py-0.5 text-xs shadow-sm ring-1 ring-border"
            >
              {tags.length}
              <Icon icon={FullScreenIcon} className="size-3" />
            </button>
          </DialogTrigger>
        )}
      </div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tags.length} {itemLabel}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <EnumBadge key={tag.label} value={tag} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

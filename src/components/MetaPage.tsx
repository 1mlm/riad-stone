import type { HugeIcon } from "@/components/Icon";
import { Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";

// generic icon + title (+ optional subtitle) block for empty/info page states —
// keeps every "nothing here yet" screen in the app looking the same
export function MetaPage({
  icon,
  title,
  subtitle,
  className,
}: {
  icon: HugeIcon;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-10 text-center text-muted-foreground",
        className,
      )}
    >
      <Icon icon={icon} className="size-8" />
      <span className="text-sm font-medium text-foreground">{title}</span>
      {subtitle && <span className="text-xs">{subtitle}</span>}
    </div>
  );
}

import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";
import { ICONS } from "@/utils/icon";

export function FormError({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  if (!children) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm text-destructive",
        className,
      )}
    >
      <Icon icon={ICONS.alert} />
      {children}
    </span>
  );
}

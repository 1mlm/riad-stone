"use client";

import { type ReactNode, useEffect } from "react";
import { Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";
import { haptic } from "@/utils/haptics";
import { ICONS } from "@/utils/icon";

export function FormError({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: only fires when the error appears, not on every children re-render
  useEffect(() => {
    if (children) haptic("error");
  }, [Boolean(children)]);

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

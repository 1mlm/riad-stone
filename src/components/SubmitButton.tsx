"use client";

import { Loading01Icon } from "@hugeicons/core-free-icons";
import type { ComponentProps, ReactNode } from "react";
import { type HugeIcon, Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";

// every form dialog's submit button was disabling itself on pending but
// still showing its normal icon — no feedback that anything was happening,
// e.g. during a slow request while the app redeploys
export function SubmitButton({
  icon,
  pending,
  disabled,
  children,
  ...props
}: Omit<ComponentProps<typeof Button>, "type" | "children"> & {
  icon: HugeIcon;
  pending: boolean;
  children: ReactNode;
}) {
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      <Icon
        icon={pending ? Loading01Icon : icon}
        className={pending ? "animate-spin" : undefined}
      />
      {children}
    </Button>
  );
}

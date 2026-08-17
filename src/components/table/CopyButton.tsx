"use client";

import { CheckIcon, Copy01Icon } from "@hugeicons/core-free-icons";
import { type ComponentProps, useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { copyToClipboard } from "@/utils/clipboard";
import { haptic } from "@/utils/haptics";

export function CopyButton({
  value,
  variant = "ghost",
  size = "icon",
  className,
}: {
  value: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(value);
    setCopied(true);
    haptic("light");
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <Button
      {...{ variant, size }}
      className={cn(size === "icon" && "size-6", className)}
      onClick={handleCopy}
    >
      <Icon icon={copied ? CheckIcon : Copy01Icon} />
    </Button>
  );
}

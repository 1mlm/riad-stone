"use client";

import { Delete02Icon } from "@hugeicons/core-free-icons";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";

export function DeleteRowButton({
  title,
  content,
  confirmLabel = "Delete",
  cancelLabel,
  waitingLabel,
  onConfirm,
}: {
  title: string;
  content: string;
  confirmLabel?: string;
  cancelLabel?: string;
  waitingLabel?: string;
  onConfirm: () => Promise<{ error: string | null }>;
}) {
  return (
    <ConfirmDialog
      trigger={
        <Button
          variant="destructive"
          size="icon-sm"
          className="corner-squircle"
        >
          <Icon icon={Delete02Icon} />
        </Button>
      }
      confirmIcon={Delete02Icon}
      {...{
        title,
        content,
        confirmLabel,
        cancelLabel,
        waitingLabel,
        onConfirm,
      }}
    />
  );
}

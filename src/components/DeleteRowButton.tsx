"use client";

import { Delete02Icon } from "@hugeicons/core-free-icons";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";

export function DeleteRowButton({
  title,
  content,
  onConfirm,
}: {
  title: string;
  content: string;
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
      confirmLabel="Supprimer"
      confirmIcon={Delete02Icon}
      {...{ title, content, onConfirm }}
    />
  );
}

"use client";

import { Delete02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";
import { DropdownMenuItem } from "@/shadcn/ui/dropdown-menu";
import { haptic } from "@/utils/haptics";
import { runUndoableAction } from "@/utils/undoableAction";

export function DeleteRowMenuItem({
  label,
  message,
  undoLabel,
  onOptimisticRemove,
  onRevert,
  commit,
}: {
  label: string;
  message: string;
  undoLabel?: string;
  onOptimisticRemove: () => void;
  onRevert: () => void;
  commit: () => Promise<{ error: string | null } | undefined>;
}) {
  return (
    <DropdownMenuItem
      variant="destructive"
      onSelect={() => {
        haptic("warning");
        onOptimisticRemove();
        runUndoableAction({ commit, onRevert, message, undoLabel });
      }}
    >
      <Icon icon={Delete02Icon} />
      {label}
    </DropdownMenuItem>
  );
}

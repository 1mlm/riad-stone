"use client";

import { Delete02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { haptic } from "@/utils/haptics";
import { runUndoableAction } from "@/utils/undoableAction";

export function DeleteRowButton({
  message,
  undoLabel,
  onOptimisticRemove,
  onRevert,
  commit,
}: {
  message: string;
  undoLabel?: string;
  onOptimisticRemove: () => void;
  onRevert: () => void;
  commit: () => Promise<{ error: string | null } | undefined>;
}) {
  return (
    <Button
      variant="destructive"
      size="icon-sm"
      className="corner-squircle"
      onClick={() => {
        haptic("warning");
        onOptimisticRemove();
        runUndoableAction({ commit, onRevert, message, undoLabel });
      }}
    >
      <Icon icon={Delete02Icon} />
    </Button>
  );
}

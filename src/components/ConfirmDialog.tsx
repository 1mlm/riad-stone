"use client";

import { Alert02Icon } from "@hugeicons/core-free-icons";
import {
  type ComponentProps,
  type ReactNode,
  useState,
  useTransition,
} from "react";
import { DelayedButton } from "@/components/DelayedButton";
import { type HugeIcon, Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { ICONS } from "@/utils/icon";

export function ConfirmDialog({
  trigger,
  title,
  content,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  confirmIcon,
  cancelIcon = ICONS.cancel,
  confirmVariant = "destructive",
  waitSeconds = 7,
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  content: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmIcon: HugeIcon;
  cancelIcon?: HugeIcon;
  confirmVariant?: ComponentProps<typeof Button>["variant"];
  waitSeconds?: number;
  onConfirm: () => Promise<{ error: string | null } | undefined>;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleConfirm = () =>
    startTransition(async () => {
      const result = await onConfirm();
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setOpen(false);
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setError(null);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">{content}</div>
        {error && (
          <span className="inline-flex items-center gap-1.5 text-sm text-destructive">
            <Icon icon={Alert02Icon} />
            {error}
          </span>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="rounded-full corner-squircle">
              <Icon icon={cancelIcon} />
              {cancelLabel}
            </Button>
          </DialogClose>
          <DelayedButton
            variant={confirmVariant}
            className="rounded-full corner-squircle"
            waitSeconds={waitSeconds}
            disabled={pending}
            onClick={handleConfirm}
          >
            <Icon icon={confirmIcon} />
            {confirmLabel}
          </DelayedButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

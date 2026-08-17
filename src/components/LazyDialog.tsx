"use client";

import { type ReactNode, useState } from "react";
import { type HugeIcon, Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { Skeleton } from "@/shadcn/ui/skeleton";

const SKELETON_KEYS = ["a", "b", "c"];

// an icon-button dialog whose content is fetched the first time it opens and
// kept for the rest of the page's life — a row action shouldn't cost a
// request until someone actually clicks it
export function LazyDialog<T>({
  triggerIcon,
  trigger,
  title,
  load,
  children,
}: {
  triggerIcon: HugeIcon;
  trigger?: ReactNode;
  title: ReactNode;
  load: () => Promise<T>;
  children: (data: T) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState<{ data: T }>();
  const [loading, setLoading] = useState(false);

  const handleOpenChange = async (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen || loaded) return;
    setLoading(true);
    setLoaded({ data: await load() });
    setLoading(false);
  };

  return (
    <Dialog {...{ open }} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="corner-squircle"
          >
            <Icon icon={triggerIcon} />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {loading && (
          <div className="flex flex-col gap-2">
            {SKELETON_KEYS.map((key) => (
              <Skeleton key={key} className="h-6 w-full" />
            ))}
          </div>
        )}
        {!loading && loaded && children(loaded.data)}
      </DialogContent>
    </Dialog>
  );
}

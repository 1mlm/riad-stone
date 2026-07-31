"use client";

import { useState } from "react";
import { getHistoryForReference } from "@/app/(app)/historique/actions";
import { HistoryEventList } from "@/app/(app)/historique/HistoryEventList";
import { Icon } from "@/components/Icon";
import type { HistoryEvent } from "@/generated/prisma/client";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { Skeleton } from "@/shadcn/ui/skeleton";
import { ICONS } from "@/utils/icon";

export function ReferenceHistoryDialog({ reference }: { reference: string }) {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<HistoryEvent[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpenChange = async (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen && !events) {
      setLoading(true);
      setEvents(await getHistoryForReference(reference));
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="corner-squircle"
        >
          <Icon icon={ICONS.history} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Historique de {reference}</DialogTitle>
        </DialogHeader>
        {loading && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        )}
        {!loading && events && (
          <HistoryEventList
            events={events}
            emptyTitle="Aucun historique"
            emptySubtitle="Aucune action enregistrée pour cette référence."
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

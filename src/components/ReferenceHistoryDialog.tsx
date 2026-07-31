"use client";

import { getHistoryForReference } from "@/app/(app)/historique/actions";
import { HistoryEventList } from "@/app/(app)/historique/HistoryEventList";
import { LazyDialog } from "@/components/LazyDialog";
import { ICONS } from "@/utils/icon";

export function ReferenceHistoryDialog({ reference }: { reference: string }) {
  return (
    <LazyDialog
      triggerIcon={ICONS.history}
      title={`Historique de ${reference}`}
      load={() => getHistoryForReference(reference)}
    >
      {(events) => (
        <HistoryEventList
          {...{ events }}
          emptyTitle="Aucun historique"
          emptySubtitle="Aucune action enregistrée pour cette référence."
        />
      )}
    </LazyDialog>
  );
}

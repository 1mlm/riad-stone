"use client";

import { Delete02Icon } from "@hugeicons/core-free-icons";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Icon } from "@/components/Icon";
import { fr } from "@/messages/fr";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { EntreeFormFields } from "./EntreeFormFields";
import type { Card } from "./useEntreeCardCarousel";

export function EntreeCard({
  card,
  invalid,
  onDelete,
  cardRef,
  fieldSuggestions,
}: {
  card: Card;
  invalid: boolean;
  onDelete: () => void;
  cardRef: (el: HTMLDivElement | null) => void;
  fieldSuggestions: { origine: string[]; conteneur: string[] };
}) {
  return (
    <div
      ref={cardRef}
      className={cn(
        // narrower than the scroll container so the next/previous card
        // peeks in on the sides instead of being fully clipped
        "flex w-[88%] shrink-0 snap-center flex-col gap-4 rounded-lg border border-border p-3 shadow-sm",
        invalid && "border-destructive",
      )}
    >
      <div className="flex justify-end">
        <ConfirmDialog
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
            >
              <Icon icon={Delete02Icon} />
            </Button>
          }
          title="Supprimer cette fiche ?"
          content="Les informations saisies dans cette fiche seront perdues."
          confirmLabel="Supprimer"
          cancelLabel={fr.common.cancel}
          waitingLabel={fr.common.pleaseWait}
          confirmIcon={Delete02Icon}
          waitSeconds={0}
          onConfirm={async () => {
            onDelete();
            return undefined;
          }}
        />
      </div>
      <EntreeFormFields
        mode="add"
        namePrefix={card.id}
        excludeKeys={["designation"]}
        {...{ fieldSuggestions }}
      />
    </div>
  );
}

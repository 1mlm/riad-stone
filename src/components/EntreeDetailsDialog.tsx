"use client";

import { useState } from "react";
import {
  type EntreeDetails,
  getEntreeDetails,
} from "@/app/(app)/entrees/actions";
import { toDisplayLength } from "@/app/(app)/entrees/fields";
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
import { ICONS } from "@/utils/icon";

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: HugeIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border/50 py-1.5 text-sm first:border-t-0">
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <Icon icon={icon} />
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function SortiesList({ sorties }: { sorties: EntreeDetails["sorties"] }) {
  if (sorties.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        Aucune sortie pour cette entrée.
      </p>
    );

  return (
    <table className="w-full text-xs">
      <tbody>
        {sorties.map((sortie) => (
          <tr key={sortie.id} className="border-t border-border/50">
            <td className="py-1.5 pr-3 whitespace-nowrap text-muted-foreground">
              {new Date(sortie.dateSortie).toLocaleDateString("fr-FR")}
            </td>
            <td className="py-1.5 pr-3 font-medium">
              {sortie.nombrePieces} pièce{sortie.nombrePieces > 1 ? "s" : ""}
            </td>
            <td className="py-1.5 text-muted-foreground">
              {sortie.bonCommande ?? "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function EntreeDetailsDialog({ reference }: { reference: string }) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<EntreeDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpenChange = async (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen && !details) {
      setLoading(true);
      setDetails(await getEntreeDetails(reference));
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
          <Icon icon={ICONS.details} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Détails de l'entrée {reference}</DialogTitle>
        </DialogHeader>
        {loading && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        )}
        {!loading && !details && (
          <p className="text-sm text-muted-foreground">
            Cette entrée est introuvable.
          </p>
        )}
        {!loading && details && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <SummaryRow
                icon={ICONS.designation}
                label="Désignation"
                value={details.designation}
              />
              <SummaryRow
                icon={ICONS.date}
                label="Date d'entrée"
                value={new Date(details.date).toLocaleDateString("fr-FR")}
              />
              <SummaryRow
                icon={ICONS.location}
                label="Origine"
                value={details.origine ?? "—"}
              />
              <SummaryRow
                icon={ICONS.length}
                label="Longueur"
                value={`${toDisplayLength(details.longueur).toFixed(2)} cm`}
              />
              <SummaryRow
                icon={ICONS.width}
                label="Largeur"
                value={`${toDisplayLength(details.largeur).toFixed(2)} cm`}
              />
              <SummaryRow
                icon={ICONS.pieces}
                label="Pièces au total"
                value={String(details.nombrePieces)}
              />
              <SummaryRow
                icon={ICONS.pieces}
                label="Pièces restantes"
                value={String(details.piecesRestantes)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">
                Sorties
              </span>
              <SortiesList sorties={details.sorties} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

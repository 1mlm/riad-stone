"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import {
  type EntreeDetails,
  getEntreeDetails,
} from "@/app/(app)/entrees/actions";
import { toDisplayLength } from "@/app/(app)/entrees/fields";
import { AddSortieDialog } from "@/app/(app)/sorties/AddSortieDialog";
import { Icon } from "@/components/Icon";
import { LazyDialog } from "@/components/LazyDialog";
import { Button } from "@/shadcn/ui/button";
import { formatShortDate } from "@/utils/date";
import { ICONS } from "@/utils/icon";

function getSummaryRows(details: EntreeDetails) {
  return [
    {
      icon: ICONS.designation,
      label: "Désignation",
      value: details.designation,
    },
    {
      icon: ICONS.date,
      label: "Date d'entrée",
      value: formatShortDate(details.date),
    },
    { icon: ICONS.location, label: "Origine", value: details.origine ?? "-" },
    {
      icon: ICONS.conteneur,
      label: "N° de contenaire",
      value: details.conteneur ?? "-",
    },
    {
      icon: ICONS.length,
      label: "Longueur",
      value: `${toDisplayLength(details.longueur).toFixed(2)} cm`,
    },
    {
      icon: ICONS.width,
      label: "Largeur",
      value: `${toDisplayLength(details.largeur).toFixed(2)} cm`,
    },
    {
      icon: ICONS.pieces,
      label: "Pièces au total",
      value: String(details.nombrePieces),
    },
    {
      icon: ICONS.pieces,
      label: "Pièces restantes",
      value: String(details.piecesRestantes),
    },
  ];
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
              {formatShortDate(sortie.dateSortie)}
            </td>
            <td className="py-1.5 pr-3 font-medium">
              {sortie.nombrePieces} pièce{sortie.nombrePieces > 1 ? "s" : ""}
            </td>
            <td className="py-1.5 font-mono text-muted-foreground">
              {sortie.bonCommande ?? "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function EntreeDetailsDialog({
  reference,
  // hides the "Ajouter une sortie" action — set to false when this dialog is
  // itself opened from within a sortie form, so opening it doesn't offer to
  // open another sortie form on top of the one already open
  allowAddSortie = true,
}: {
  reference: string;
  allowAddSortie?: boolean;
}) {
  return (
    <LazyDialog
      triggerIcon={ICONS.details}
      title={`Détails de l'entrée ${reference}`}
      load={() => getEntreeDetails(reference)}
    >
      {(details) =>
        details ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              {getSummaryRows(details).map(({ icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 border-t border-border/50 py-1.5 text-sm first:border-t-0"
                >
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Icon {...{ icon }} />
                    {label}
                  </span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">
                Sorties
              </span>
              <SortiesList sorties={details.sorties} />
            </div>
            {allowAddSortie && details.piecesRestantes > 0 && (
              <AddSortieDialog
                availableEntrees={[
                  {
                    reference: details.reference,
                    designation: details.designation,
                    piecesRestantes: details.piecesRestantes,
                  },
                ]}
                initialReference={details.reference}
                trigger={
                  <Button className="rounded-full corner-squircle">
                    <Icon icon={PlusSignIcon} />
                    Ajouter une sortie
                  </Button>
                }
              />
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Cette entrée est introuvable.
          </p>
        )
      }
    </LazyDialog>
  );
}

"use client";

import { Icon } from "@/components/Icon";
import { UnitDropdown } from "@/components/UnitDropdown";
import { fr } from "@/messages/fr";
import { Button } from "@/shadcn/ui/button";
import { Checkbox } from "@/shadcn/ui/checkbox";
import { Input } from "@/shadcn/ui/input";
import { InputGroup, InputGroupInput } from "@/shadcn/ui/input-group";
import { cn } from "@/shadcn/utils";
import { ICONS } from "@/utils/icon";
import { ImportDateCell } from "./ImportDateCell";
import type { ParsedEntreeRow } from "./types";
import type { RowFieldError } from "./validateImportRow";

// every cell is a plain controlled input rather than the uncontrolled
// name/FormData pattern the add/edit forms use — the preview needs to
// recompute validity (including cross-row duplicate references) on every
// keystroke, which an uncontrolled field can't drive
export function ImportPreviewRow({
  row,
  errors,
  selected,
  onToggleSelected,
  onChange,
  onDelete,
}: {
  row: ParsedEntreeRow;
  errors: Set<RowFieldError>;
  selected: boolean;
  onToggleSelected: () => void;
  onChange: (row: ParsedEntreeRow) => void;
  onDelete: () => void;
}) {
  const set = <K extends keyof ParsedEntreeRow>(
    key: K,
    value: ParsedEntreeRow[K],
  ) => onChange({ ...row, [key]: value });

  const cellClass = (hasError: boolean) =>
    cn("p-1 align-top", hasError && "bg-destructive/10");

  return (
    <tr className={cn("border-t border-border/50", selected && "bg-primary/5")}>
      <td className="p-1 text-center align-top">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggleSelected}
          aria-label="Sélectionner cette ligne"
        />
      </td>
      <td className={cellClass(errors.has("reference"))}>
        <Input
          value={row.reference ?? ""}
          onChange={(event) => set("reference", event.target.value || null)}
          aria-invalid={
            errors.has("reference") || errors.has("duplicateReference")
          }
          className="w-28 font-mono"
        />
      </td>
      <td className={cellClass(errors.has("designation"))}>
        <Input
          value={row.designation ?? ""}
          onChange={(event) => set("designation", event.target.value || null)}
          aria-invalid={errors.has("designation")}
          className="w-40"
        />
      </td>
      <td className={cellClass(errors.has("longueurValue"))}>
        <InputGroup className="w-28">
          <InputGroupInput
            type="number"
            min="1"
            step="1"
            value={row.longueurValue ?? ""}
            onChange={(event) =>
              set(
                "longueurValue",
                event.target.value ? Number(event.target.value) : null,
              )
            }
            aria-invalid={errors.has("longueurValue")}
          />
          <UnitDropdown
            unit={row.longueurUnit}
            onUnitChange={(unit) => set("longueurUnit", unit)}
          />
        </InputGroup>
      </td>
      <td className={cellClass(errors.has("largeurValue"))}>
        <InputGroup className="w-28">
          <InputGroupInput
            type="number"
            min="1"
            step="1"
            value={row.largeurValue ?? ""}
            onChange={(event) =>
              set(
                "largeurValue",
                event.target.value ? Number(event.target.value) : null,
              )
            }
            aria-invalid={errors.has("largeurValue")}
          />
          <UnitDropdown
            unit={row.largeurUnit}
            onUnitChange={(unit) => set("largeurUnit", unit)}
          />
        </InputGroup>
      </td>
      <td className={cellClass(errors.has("nombrePieces"))}>
        <Input
          type="number"
          min="1"
          step="1"
          value={row.nombrePieces ?? ""}
          onChange={(event) =>
            set(
              "nombrePieces",
              event.target.value ? Number(event.target.value) : null,
            )
          }
          aria-invalid={errors.has("nombrePieces")}
          className="w-20"
        />
      </td>
      <td className="p-1 align-top">
        <ImportDateCell
          value={row.date}
          onChange={(date) => set("date", date)}
          locale={fr.common.locale}
        />
      </td>
      <td className="p-1 align-top">
        <Input
          value={row.origine ?? ""}
          onChange={(event) => set("origine", event.target.value || null)}
          className="w-28"
        />
      </td>
      <td className="p-1 align-top">
        <Input
          value={row.conteneur ?? ""}
          onChange={(event) => set("conteneur", event.target.value || null)}
          className="w-28"
        />
      </td>
      <td className="p-1 align-top">
        <Input
          value={row.commentaire ?? ""}
          onChange={(event) => set("commentaire", event.target.value || null)}
          className="w-32"
        />
      </td>
      <td className="p-1 align-top">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="Supprimer cette ligne"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Icon icon={ICONS.delete} />
        </Button>
      </td>
    </tr>
  );
}

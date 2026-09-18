"use client";

import type { HugeIcon } from "@/components/Icon";
import type { CustomTableColumn } from "@/components/table/CustomTable";
import { RowMenuItemButton } from "@/components/table/RowMenu";
import { fr } from "@/messages/fr";
import { Input } from "@/shadcn/ui/input";
import { ICONS } from "@/utils/icon";
import { ENTREE_FIELD_BY_KEY } from "../fields";
import { ImportDateCell } from "./ImportDateCell";
import type { ParsedEntreeRow } from "./types";
import type { RowFieldError } from "./validateImportRow";

type UpdateRow = (rowId: string, patch: Partial<ParsedEntreeRow>) => void;
type GetRowErrors = (row: ParsedEntreeRow) => Set<RowFieldError>;

// shared chrome (header icon/label, red cell on error, aria-invalid) behind
// every plain text field — designation/reference/origine/conteneur/
// commentaire all read/write a different property, passed in as
// getValue/setValue instead of a computed ParsedEntreeRow[key] lookup, which
// TS can't carry through an object-literal patch cleanly
function createEditableTextColumn({
  key,
  label,
  icon,
  updateRow,
  getRowErrors,
  errorKeys,
  monospace,
  getValue,
  setValue,
}: {
  key: string;
  label: string;
  icon: HugeIcon;
  updateRow: UpdateRow;
  getRowErrors: GetRowErrors;
  errorKeys?: RowFieldError[];
  monospace?: boolean;
  getValue: (row: ParsedEntreeRow) => string | null;
  setValue: (value: string | null) => Partial<ParsedEntreeRow>;
}): CustomTableColumn<ParsedEntreeRow> {
  const hasError = (row: ParsedEntreeRow) =>
    errorKeys?.some((errorKey) => getRowErrors(row).has(errorKey)) ?? false;
  return {
    id: key,
    label,
    icon,
    type: "string",
    monospace,
    getString: (row) => getValue(row) ?? "",
    getCellError: errorKeys ? hasError : undefined,
    render: (row) => (
      <Input
        value={getValue(row) ?? ""}
        onChange={(event) =>
          updateRow(row.id, setValue(event.target.value || null))
        }
        aria-invalid={errorKeys ? hasError(row) : undefined}
        className={monospace ? "font-mono" : undefined}
      />
    ),
  };
}

// same shared chrome for the two whole-number fields (longueur/largeur are
// always whole cm by this point — see units.ts — nombrePieces is a plain count)
function createEditableNumberColumn({
  key,
  label,
  icon,
  suffix,
  updateRow,
  getRowErrors,
  errorKey,
  getValue,
  setValue,
}: {
  key: string;
  label: string;
  icon: HugeIcon;
  suffix?: string;
  updateRow: UpdateRow;
  getRowErrors: GetRowErrors;
  errorKey: RowFieldError;
  getValue: (row: ParsedEntreeRow) => number | null;
  setValue: (value: number | null) => Partial<ParsedEntreeRow>;
}): CustomTableColumn<ParsedEntreeRow> {
  const hasError = (row: ParsedEntreeRow) => getRowErrors(row).has(errorKey);
  return {
    id: key,
    label,
    icon,
    suffix,
    type: "string",
    align: "right",
    filterType: "number",
    getNumber: (row) => getValue(row) ?? 0,
    getString: (row) => getValue(row)?.toString() ?? "",
    getCellError: hasError,
    render: (row) => (
      <Input
        type="number"
        min="1"
        step="1"
        value={getValue(row) ?? ""}
        onChange={(event) =>
          updateRow(
            row.id,
            setValue(event.target.value ? Number(event.target.value) : null),
          )
        }
        aria-invalid={hasError(row)}
        className="w-20 text-right"
      />
    ),
  };
}

function createDateColumn(
  updateRow: UpdateRow,
): CustomTableColumn<ParsedEntreeRow> {
  const { label, icon } = ENTREE_FIELD_BY_KEY.date;
  return {
    id: "date",
    label,
    icon,
    type: "string",
    getString: (row) => row.date,
    render: (row) => (
      <ImportDateCell
        value={row.date}
        onChange={(date) => updateRow(row.id, { date })}
        locale={fr.common.locale}
      />
    ),
  };
}

function createActionsColumn(
  deleteRow: (rowId: string) => void,
): CustomTableColumn<ParsedEntreeRow> {
  return {
    id: "actions",
    label: "Actions",
    icon: ICONS.actions,
    type: "buttons",
    getButtons: (row, selectItem) => (
      <>
        {selectItem}
        <RowMenuItemButton
          icon={ICONS.delete}
          className="text-destructive hover:text-destructive"
          onClick={() => deleteRow(row.id)}
        >
          Supprimer cette ligne
        </RowMenuItemButton>
      </>
    ),
  };
}

export function buildImportPreviewColumns({
  updateRow,
  deleteRow,
  getRowErrors,
}: {
  updateRow: UpdateRow;
  deleteRow: (rowId: string) => void;
  getRowErrors: GetRowErrors;
}): CustomTableColumn<ParsedEntreeRow>[] {
  const {
    reference,
    designation,
    longueur,
    largeur,
    nombrePieces,
    origine,
    conteneur,
    commentaire,
  } = ENTREE_FIELD_BY_KEY;

  return [
    createEditableTextColumn({
      key: "reference",
      label: reference.label,
      icon: reference.icon,
      monospace: true,
      updateRow,
      getRowErrors,
      errorKeys: ["reference", "duplicateReference"],
      getValue: (row) => row.reference,
      setValue: (value) => ({ reference: value }),
    }),
    createEditableTextColumn({
      key: "designation",
      label: designation.label,
      icon: designation.icon,
      updateRow,
      getRowErrors,
      errorKeys: ["designation"],
      getValue: (row) => row.designation,
      setValue: (value) => ({ designation: value }),
    }),
    createEditableNumberColumn({
      key: "longueurValue",
      label: longueur.label,
      icon: longueur.icon,
      suffix: "cm",
      updateRow,
      getRowErrors,
      errorKey: "longueurValue",
      getValue: (row) => row.longueurValue,
      setValue: (value) => ({ longueurValue: value }),
    }),
    createEditableNumberColumn({
      key: "largeurValue",
      label: largeur.label,
      icon: largeur.icon,
      suffix: "cm",
      updateRow,
      getRowErrors,
      errorKey: "largeurValue",
      getValue: (row) => row.largeurValue,
      setValue: (value) => ({ largeurValue: value }),
    }),
    createEditableNumberColumn({
      key: "nombrePieces",
      label: nombrePieces.label,
      icon: nombrePieces.icon,
      updateRow,
      getRowErrors,
      errorKey: "nombrePieces",
      getValue: (row) => row.nombrePieces,
      setValue: (value) => ({ nombrePieces: value }),
    }),
    createDateColumn(updateRow),
    createEditableTextColumn({
      key: "origine",
      label: origine.label,
      icon: origine.icon,
      updateRow,
      getRowErrors,
      getValue: (row) => row.origine,
      setValue: (value) => ({ origine: value }),
    }),
    createEditableTextColumn({
      key: "conteneur",
      label: conteneur.label,
      icon: conteneur.icon,
      updateRow,
      getRowErrors,
      getValue: (row) => row.conteneur,
      setValue: (value) => ({ conteneur: value }),
    }),
    createEditableTextColumn({
      key: "commentaire",
      label: commentaire.label,
      icon: commentaire.icon,
      updateRow,
      getRowErrors,
      getValue: (row) => row.commentaire,
      setValue: (value) => ({ commentaire: value }),
    }),
    createActionsColumn(deleteRow),
  ];
}

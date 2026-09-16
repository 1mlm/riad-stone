"use server";

import type { Entree } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { HistoryItemType } from "@/generated/prisma/enums";
import { logHistory, logHistoryBatch } from "@/utils/history";
import { LENGTH_UNITS, type LengthUnit, lengthToMeters } from "@/utils/length";
import { type PrismaTransactionClient, prisma } from "@/utils/prisma";
import { requireAuth } from "@/utils/requireAuth";
import { revalidateStockPaths } from "@/utils/revalidate";

// thrown inside a transaction to surface a validation message to the caller
// without it being mistaken for a real (retry-worthy) database error
class EntreeValidationError extends Error {
  duplicateReference?: string;
  constructor(message: string, duplicateReference?: string) {
    super(message);
    this.duplicateReference = duplicateReference;
  }
}

async function runEntreeTransaction<T>(
  fn: (tx: PrismaTransactionClient) => Promise<T>,
): Promise<
  | { result: T; error: null; duplicateReference?: undefined }
  | { result: null; error: string; duplicateReference?: string }
> {
  try {
    const result = await prisma.$transaction(fn, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    return { result, error: null };
  } catch (error) {
    if (error instanceof EntreeValidationError)
      return {
        result: null,
        error: error.message,
        duplicateReference: error.duplicateReference,
      };
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return { result: null, error: "Cette référence existe déjà." };
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    )
      return {
        result: null,
        error: "Conflit de mise à jour, veuillez réessayer.",
      };
    throw error;
  }
}

function toEntreeSnapshot(entree: Entree) {
  return {
    reference: entree.reference,
    designation: entree.designation,
    origine: entree.origine,
    conteneur: entree.conteneur,
    date: entree.date.toISOString(),
    longueur: Number(entree.longueur),
    largeur: Number(entree.largeur),
    nombrePieces: entree.nombrePieces,
    commentaire: entree.commentaire,
  };
}

export type DesignationSuggestion = {
  designation: string;
  lotCount: number;
  piecesRestantes: number;
};

// aggregated per designation so the Add Entrée combobox can show, next to
// each suggestion, how much of that designation is already in stock — the
// same density as the sortie picker's ref/date/pieces row
export async function getDesignationSuggestions(): Promise<
  DesignationSuggestion[]
> {
  const rows = await prisma.entree.findMany({
    select: {
      designation: true,
      nombrePieces: true,
      sorties: { select: { nombrePieces: true } },
    },
    orderBy: { designation: "asc" },
  });

  const byDesignation = new Map<string, DesignationSuggestion>();
  for (const row of rows) {
    const piecesRestantes =
      row.nombrePieces -
      row.sorties.reduce((sum, sortie) => sum + sortie.nombrePieces, 0);
    const existing = byDesignation.get(row.designation);
    if (existing) {
      existing.lotCount += 1;
      existing.piecesRestantes += piecesRestantes;
    } else {
      byDesignation.set(row.designation, {
        designation: row.designation,
        lotCount: 1,
        piecesRestantes,
      });
    }
  }
  return [...byDesignation.values()].sort((a, b) =>
    a.designation.localeCompare(b.designation),
  );
}

// the multi-card add form namespaces every field under a per-card uuid, which
// defeats the browser's own name-based autofill history — feeding past values
// to a SuggestionInput is the fix, for the two free-text fields worth
// suggesting
export async function getEntreeFieldSuggestions(): Promise<{
  origine: string[];
  conteneur: string[];
}> {
  const [origineRows, conteneurRows] = await Promise.all([
    prisma.entree.findMany({
      select: { origine: true },
      distinct: ["origine"],
      where: { origine: { not: null } },
      orderBy: { origine: "asc" },
    }),
    prisma.entree.findMany({
      select: { conteneur: true },
      distinct: ["conteneur"],
      where: { conteneur: { not: null } },
      orderBy: { conteneur: "asc" },
    }),
  ]);
  return {
    origine: origineRows.map((row) => row.origine).filter((v) => v !== null),
    conteneur: conteneurRows
      .map((row) => row.conteneur)
      .filter((v) => v !== null),
  };
}

export type EntreeDetails = {
  reference: string;
  designation: string;
  date: string;
  origine: string | null;
  conteneur: string | null;
  // metres
  longueur: number;
  largeur: number;
  nombrePieces: number;
  commentaire: string | null;
  piecesRestantes: number;
  sorties: {
    id: number;
    nombrePieces: number;
    dateSortie: string;
    bonCommande: string | null;
    commentaire: string | null;
  }[];
};

export async function getEntreeDetails(
  reference: string,
): Promise<EntreeDetails | null> {
  await requireAuth();

  const entree = await prisma.entree.findUnique({
    where: { reference },
    include: { sorties: { orderBy: { dateSortie: "desc" } } },
  });
  if (!entree) return null;

  const piecesSorties = entree.sorties.reduce(
    (sum, sortie) => sum + sortie.nombrePieces,
    0,
  );

  return {
    reference: entree.reference,
    designation: entree.designation,
    date: entree.date.toISOString(),
    origine: entree.origine,
    conteneur: entree.conteneur,
    longueur: Number(entree.longueur),
    largeur: Number(entree.largeur),
    nombrePieces: entree.nombrePieces,
    commentaire: entree.commentaire,
    piecesRestantes: entree.nombrePieces - piecesSorties,
    sorties: entree.sorties.map((sortie) => ({
      id: sortie.id,
      nombrePieces: sortie.nombrePieces,
      dateSortie: sortie.dateSortie.toISOString(),
      bonCommande: sortie.bonCommande,
      commentaire: sortie.commentaire,
    })),
  };
}

function isLengthUnit(value: string): value is LengthUnit {
  return (LENGTH_UNITS as readonly string[]).includes(value);
}

// the checks every entree row has to pass regardless of where it came from
// — the manual add form (via readEntreeFormData below) and a spreadsheet
// import (via importEntrees) both funnel through this, so "the import can't
// create data the manual form would reject" is structural, not just a claim
function validateEntreeFields(fields: {
  designation: string;
  reference: string;
  longueurValue: number;
  longueurUnit: string;
  largeurValue: number;
  largeurUnit: string;
  nombrePieces: number;
}) {
  // every branch is a literal (as const), not just string — that's what
  // lets a caller's `if (validateEntreeFields(...)) return {error}` narrow
  // its own return type the same way, all the way out to readEntreeFormData
  // and importEntrees's callers narrowing parsed.data. A plain `string`
  // return here type-checks too but silently loses that narrowing: TS only
  // carries a discriminant across property access when it's a literal type
  if (!fields.designation) return "La désignation est requise." as const;
  if (!fields.reference) return "La référence est requise." as const;
  if (!Number.isInteger(fields.longueurValue) || fields.longueurValue <= 0)
    return "La longueur est invalide." as const;
  if (!isLengthUnit(fields.longueurUnit))
    return "L'unité de longueur est invalide." as const;
  if (!Number.isInteger(fields.largeurValue) || fields.largeurValue <= 0)
    return "La largeur est invalide." as const;
  if (!isLengthUnit(fields.largeurUnit))
    return "L'unité de largeur est invalide." as const;
  if (!Number.isInteger(fields.nombrePieces) || fields.nombrePieces <= 0)
    return "Le nombre de pièces est invalide." as const;
  return null;
}

// reads one entree's fields off formData, optionally namespaced under
// `${namePrefix}__` — the multi-card add flow puts several cards' fields in
// one <form>, each namespaced by its own card id
function readEntreeFormData(
  formData: FormData,
  namePrefix?: string,
  designationOverride?: string,
) {
  const key = (k: string) => (namePrefix ? `${namePrefix}__${k}` : k);
  const designation =
    designationOverride ??
    String(formData.get(key("designation")) ?? "").trim();
  const reference = String(formData.get(key("reference")) ?? "").trim();
  const origine = String(formData.get(key("origine")) ?? "").trim();
  const conteneur = String(formData.get(key("conteneur")) ?? "").trim();
  const commentaire = String(formData.get(key("commentaire")) ?? "").trim();
  const date = String(formData.get(key("date")) ?? "");
  const longueurValue = Number(formData.get(key("longueurValue")));
  const longueurUnit = String(formData.get(key("longueurUnit")));
  const largeurValue = Number(formData.get(key("largeurValue")));
  const largeurUnit = String(formData.get(key("largeurUnit")));
  const nombrePieces = Number(formData.get(key("nombrePieces")));

  const validationError = validateEntreeFields({
    designation,
    reference,
    longueurValue,
    longueurUnit,
    largeurValue,
    largeurUnit,
    nombrePieces,
  });
  if (validationError) return { error: validationError };

  return {
    data: {
      designation,
      reference,
      origine: origine || null,
      conteneur: conteneur || null,
      commentaire: commentaire || null,
      date: date ? new Date(date) : new Date(),
      longueur: lengthToMeters(longueurValue, longueurUnit as LengthUnit),
      largeur: lengthToMeters(largeurValue, largeurUnit as LengthUnit),
      nombrePieces,
    },
  };
}

export type CreateEntreesResult = {
  error: string | null;
  // the offending reference, if the error is a duplicate — the client
  // matches it against its own cards' current values to decide which one
  // (of possibly two) to jump to
  duplicateReference?: string;
  // which card failed a non-duplicate validation (bad longueur/largeur/
  // nombrePieces/etc) so the client can jump straight to it instead of
  // leaving the user to guess which of several cards is at fault
  invalidCardId?: string;
};

// creates every card under one shared designation in a single transaction:
// either all of them land, or none do
export async function createEntrees(
  _prevState: CreateEntreesResult,
  formData: FormData,
): Promise<CreateEntreesResult> {
  await requireAuth();

  const designation = String(formData.get("designation") ?? "").trim();
  if (!designation) return { error: "La désignation est requise." };

  const cardIds = String(formData.get("cardIds") ?? "")
    .split(",")
    .filter(Boolean);
  if (cardIds.length === 0) return { error: "Ajoutez au moins une fiche." };

  const parsedCards: {
    cardId: string;
    data: NonNullable<ReturnType<typeof readEntreeFormData>["data"]>;
  }[] = [];
  for (const cardId of cardIds) {
    const parsed = readEntreeFormData(formData, cardId, designation);
    if (parsed.error) return { error: parsed.error, invalidCardId: cardId };
    parsedCards.push({ cardId, data: parsed.data });
  }

  const referencesSoFar = new Set<string>();
  for (const { data } of parsedCards) {
    if (referencesSoFar.has(data.reference))
      return {
        error: `La référence "${data.reference}" est utilisée par deux fiches.`,
        duplicateReference: data.reference,
      };
    referencesSoFar.add(data.reference);
  }

  const outcome = await runEntreeTransaction(async (tx) => {
    const existing = await tx.entree.findMany({
      where: { reference: { in: [...referencesSoFar] } },
      select: { reference: true },
    });
    if (existing.length > 0)
      throw new EntreeValidationError(
        `La référence "${existing[0].reference}" existe déjà.`,
        existing[0].reference,
      );

    return Promise.all(
      parsedCards.map(({ data }) => tx.entree.create({ data })),
    );
  });
  if (outcome.result === null)
    return {
      error: outcome.error,
      duplicateReference: outcome.duplicateReference,
    };

  await logHistoryBatch(
    HistoryItemType.CREATE_INPUT,
    outcome.result.map(toEntreeSnapshot),
  );
  revalidateStockPaths();
  return { error: null };
}

export async function updateEntree(
  originalReference: string,
  _prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  await requireAuth();

  const parsed = readEntreeFormData(formData);
  if (parsed.error) return { error: parsed.error };

  const outcome = await runEntreeTransaction(async (tx) => {
    const existing = await tx.entree.findUnique({
      where: { reference: originalReference },
      include: { sorties: { select: { id: true } } },
    });
    if (!existing)
      throw new EntreeValidationError("Cette entrée n'existe pas.");
    if (existing.sorties.length > 0)
      throw new EntreeValidationError(
        "Cette entrée a déjà une sortie associée, elle ne peut plus être modifiée.",
      );

    const hasChanges =
      existing.designation !== parsed.data.designation ||
      existing.origine !== parsed.data.origine ||
      existing.conteneur !== parsed.data.conteneur ||
      existing.commentaire !== parsed.data.commentaire ||
      existing.date.getTime() !== parsed.data.date.getTime() ||
      Number(existing.longueur) !== parsed.data.longueur ||
      Number(existing.largeur) !== parsed.data.largeur ||
      existing.nombrePieces !== parsed.data.nombrePieces;
    if (!hasChanges) return { existing, updated: null };

    const updated = await tx.entree.update({
      where: { reference: originalReference },
      data: {
        designation: parsed.data.designation,
        origine: parsed.data.origine,
        conteneur: parsed.data.conteneur,
        commentaire: parsed.data.commentaire,
        date: parsed.data.date,
        longueur: parsed.data.longueur,
        largeur: parsed.data.largeur,
        nombrePieces: parsed.data.nombrePieces,
      },
    });
    return { existing, updated };
  });
  if (outcome.result === null) return { error: outcome.error };

  if (outcome.result.updated) {
    await logHistory(HistoryItemType.UPDATE_INPUT, {
      before: toEntreeSnapshot(outcome.result.existing),
      after: toEntreeSnapshot(outcome.result.updated),
    });
    revalidateStockPaths();
  }
  return { error: null };
}

export async function deleteEntree(
  reference: string,
): Promise<{ error: string | null }> {
  await requireAuth();

  const outcome = await runEntreeTransaction(async (tx) => {
    const existing = await tx.entree.findUnique({
      where: { reference },
      include: { sorties: { select: { id: true } } },
    });
    if (!existing) return null;
    if (existing.sorties.length > 0)
      throw new EntreeValidationError(
        "Cette entrée a déjà une sortie associée, elle ne peut pas être supprimée.",
      );

    await tx.entree.delete({ where: { reference } });
    return existing;
  });
  if (outcome.result === null && outcome.error) return { error: outcome.error };
  if (!outcome.result) return { error: null };

  await logHistory(
    HistoryItemType.DELETE_INPUT,
    toEntreeSnapshot(outcome.result),
  );
  revalidateStockPaths();
  return { error: null };
}

// every reference already in stock, for the import preview to flag a
// collision the moment a row is edited rather than only at submit — the
// transaction below still re-checks for real at import time, since a
// reference could be taken by someone else between the preview loading and
// the submit landing
export async function getExistingReferences(): Promise<string[]> {
  const rows = await prisma.entree.findMany({ select: { reference: true } });
  return rows.map((row) => row.reference);
}

export type ImportEntreeInput = {
  designation: string;
  reference: string;
  origine: string | null;
  conteneur: string | null;
  commentaire: string | null;
  date: string;
  longueurValue: number;
  longueurUnit: string;
  largeurValue: number;
  largeurUnit: string;
  nombrePieces: number;
};

export type ImportEntreesResult = {
  error: string | null;
  // the offending reference and which of the submitted rows (by index) it
  // came from, so the client can jump straight back to it in the preview
  duplicateReference?: string;
  invalidRowIndex?: number;
};

// same shape as createEntrees, minus the shared-designation/multi-fiche
// framing that doesn't apply here: every row validates through the exact
// checks the manual form uses (validateEntreeFields), and either all of
// them land in one transaction or none do
export async function importEntrees(
  rows: ImportEntreeInput[],
): Promise<ImportEntreesResult> {
  await requireAuth();

  if (rows.length === 0) return { error: "Aucune ligne à importer." };

  const parsedRows: {
    index: number;
    data: NonNullable<ReturnType<typeof readEntreeFormData>["data"]>;
  }[] = [];
  for (const [index, row] of rows.entries()) {
    const validationError = validateEntreeFields(row);
    if (validationError)
      return { error: validationError, invalidRowIndex: index };
    // validateEntreeFields already confirmed these above — this repeats it
    // as a direct isLengthUnit(...) call so TS narrows row.longueurUnit/
    // largeurUnit to LengthUnit for lengthToMeters below. A validator
    // reached through a function call doesn't narrow its caller's variables
    if (!isLengthUnit(row.longueurUnit) || !isLengthUnit(row.largeurUnit))
      return { error: "L'unité est invalide.", invalidRowIndex: index };
    parsedRows.push({
      index,
      data: {
        designation: row.designation,
        reference: row.reference,
        origine: row.origine,
        conteneur: row.conteneur,
        commentaire: row.commentaire,
        date: new Date(row.date),
        longueur: lengthToMeters(row.longueurValue, row.longueurUnit),
        largeur: lengthToMeters(row.largeurValue, row.largeurUnit),
        nombrePieces: row.nombrePieces,
      },
    });
  }

  const referencesSoFar = new Map<string, number>();
  for (const { index, data } of parsedRows) {
    const firstIndex = referencesSoFar.get(data.reference);
    if (firstIndex !== undefined)
      return {
        error: `La référence "${data.reference}" apparaît sur plusieurs lignes.`,
        duplicateReference: data.reference,
        invalidRowIndex: index,
      };
    referencesSoFar.set(data.reference, index);
  }

  const outcome = await runEntreeTransaction(async (tx) => {
    const existing = await tx.entree.findMany({
      where: { reference: { in: [...referencesSoFar.keys()] } },
      select: { reference: true },
    });
    if (existing.length > 0)
      throw new EntreeValidationError(
        `La référence "${existing[0].reference}" existe déjà.`,
        existing[0].reference,
      );

    return Promise.all(
      parsedRows.map(({ data }) => tx.entree.create({ data })),
    );
  });
  if (outcome.result === null) {
    const failedIndex = outcome.duplicateReference
      ? referencesSoFar.get(outcome.duplicateReference)
      : undefined;
    return {
      error: outcome.error,
      duplicateReference: outcome.duplicateReference,
      invalidRowIndex: failedIndex,
    };
  }

  await logHistoryBatch(
    HistoryItemType.IMPORT_INPUT,
    outcome.result.map(toEntreeSnapshot),
  );
  revalidateStockPaths();
  return { error: null };
}

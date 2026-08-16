"use server";

import type { Entree } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { HistoryItemType } from "@/generated/prisma/enums";
import { logHistory } from "@/utils/history";
import { LENGTH_UNITS, type LengthUnit, lengthToMeters } from "@/utils/length";
import { prisma } from "@/utils/prisma";
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
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
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
  };
}

export async function getDesignationSuggestions(): Promise<string[]> {
  const rows = await prisma.entree.findMany({
    select: { designation: true },
    distinct: ["designation"],
    orderBy: { designation: "asc" },
  });
  return rows.map((row) => row.designation);
}

// the multi-card add form namespaces every field under a per-card uuid, which
// defeats the browser's own name-based autofill history — a datalist fed by
// past values is the fix, for the two free-text fields worth suggesting
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
  piecesRestantes: number;
  sorties: {
    id: number;
    nombrePieces: number;
    dateSortie: string;
    bonCommande: string | null;
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
    piecesRestantes: entree.nombrePieces - piecesSorties,
    sorties: entree.sorties.map((sortie) => ({
      id: sortie.id,
      nombrePieces: sortie.nombrePieces,
      dateSortie: sortie.dateSortie.toISOString(),
      bonCommande: sortie.bonCommande,
    })),
  };
}

function isLengthUnit(value: string): value is LengthUnit {
  return (LENGTH_UNITS as readonly string[]).includes(value);
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
  const date = String(formData.get(key("date")) ?? "");
  const longueurValue = Number(formData.get(key("longueurValue")));
  const longueurUnit = String(formData.get(key("longueurUnit")));
  const largeurValue = Number(formData.get(key("largeurValue")));
  const largeurUnit = String(formData.get(key("largeurUnit")));
  const nombrePieces = Number(formData.get(key("nombrePieces")));

  if (!designation) return { error: "La désignation est requise." as const };
  if (!reference) return { error: "La référence est requise." as const };
  if (!Number.isInteger(longueurValue) || longueurValue <= 0)
    return { error: "La longueur est invalide." as const };
  if (!isLengthUnit(longueurUnit))
    return { error: "L'unité de longueur est invalide." as const };
  if (!Number.isInteger(largeurValue) || largeurValue <= 0)
    return { error: "La largeur est invalide." as const };
  if (!isLengthUnit(largeurUnit))
    return { error: "L'unité de largeur est invalide." as const };
  if (!Number.isInteger(nombrePieces) || nombrePieces <= 0)
    return { error: "Le nombre de pièces est invalide." as const };

  return {
    data: {
      designation,
      reference,
      origine: origine || null,
      conteneur: conteneur || null,
      date: date ? new Date(date) : new Date(),
      longueur: lengthToMeters(longueurValue, longueurUnit),
      largeur: lengthToMeters(largeurValue, largeurUnit),
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

  for (const entree of outcome.result)
    await logHistory(HistoryItemType.CREATE_INPUT, toEntreeSnapshot(entree));
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

    const updated = await tx.entree.update({
      where: { reference: originalReference },
      data: {
        designation: parsed.data.designation,
        origine: parsed.data.origine,
        conteneur: parsed.data.conteneur,
        date: parsed.data.date,
        longueur: parsed.data.longueur,
        largeur: parsed.data.largeur,
        nombrePieces: parsed.data.nombrePieces,
      },
    });
    return { existing, updated };
  });
  if (outcome.result === null) return { error: outcome.error };

  await logHistory(HistoryItemType.UPDATE_INPUT, {
    before: toEntreeSnapshot(outcome.result.existing),
    after: toEntreeSnapshot(outcome.result.updated),
  });
  revalidateStockPaths();
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

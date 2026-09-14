"use server";

import type { Sortie } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { HistoryItemType } from "@/generated/prisma/enums";
import { logHistory } from "@/utils/history";
import { type PrismaTransactionClient, prisma } from "@/utils/prisma";
import { requireAuth } from "@/utils/requireAuth";
import { revalidateStockPaths } from "@/utils/revalidate";
import type { AvailableEntree } from "./types";

function toSortieSnapshot(sortie: Sortie) {
  return {
    entreeReference: sortie.entreeReference,
    nombrePieces: sortie.nombrePieces,
    bonCommande: sortie.bonCommande,
    commentaire: sortie.commentaire,
    dateSortie: sortie.dateSortie.toISOString(),
  };
}

// thrown inside a transaction to surface a validation message to the caller
// without it being mistaken for a real (retry-worthy) database error
class SortieValidationError extends Error {}

async function getPiecesRestantes(
  tx: PrismaTransactionClient,
  reference: string,
  excludeSortieId?: number,
): Promise<number | null> {
  const entree = await tx.entree.findUnique({
    where: { reference },
    select: {
      nombrePieces: true,
      sorties: { select: { id: true, nombrePieces: true } },
    },
  });
  if (!entree) return null;

  const piecesSorties = entree.sorties
    .filter((sortie) => sortie.id !== excludeSortieId)
    .reduce((sum, sortie) => sum + sortie.nombrePieces, 0);
  return entree.nombrePieces - piecesSorties;
}

export async function getAvailableEntrees(): Promise<AvailableEntree[]> {
  const entrees = await prisma.entree.findMany({
    select: {
      reference: true,
      designation: true,
      date: true,
      nombrePieces: true,
      sorties: { select: { nombrePieces: true } },
    },
    orderBy: { reference: "asc" },
  });

  return entrees
    .map((entree) => ({
      reference: entree.reference,
      designation: entree.designation,
      date: entree.date,
      piecesTotal: entree.nombrePieces,
      piecesRestantes:
        entree.nombrePieces -
        entree.sorties.reduce((sum, sortie) => sum + sortie.nombrePieces, 0),
    }))
    .filter((entree) => entree.piecesRestantes > 0);
}

// reads one sortie's fields off formData, optionally namespaced under
// `${namePrefix}__` — the multi-fiche add flow puts several fiches' fields
// in one <form>, each namespaced by its own card id
function readSortieFormData(formData: FormData, namePrefix?: string) {
  const key = (k: string) => (namePrefix ? `${namePrefix}__${k}` : k);
  const bonCommande = String(formData.get(key("bonCommande")) ?? "").trim();
  const commentaire = String(formData.get(key("commentaire")) ?? "").trim();
  const dateSortie = String(formData.get(key("dateSortie")) ?? "");
  const nombrePieces = Number(formData.get(key("nombrePieces")));

  if (!Number.isInteger(nombrePieces) || nombrePieces <= 0)
    return { error: "Le nombre de pièces est invalide." as const };

  return {
    data: {
      nombrePieces,
      bonCommande: bonCommande || null,
      commentaire: commentaire || null,
      dateSortie: dateSortie ? new Date(dateSortie) : new Date(),
    },
  };
}

async function runSortieTransaction<T>(
  fn: (tx: PrismaTransactionClient) => Promise<T>,
): Promise<{ result: T; error: null } | { result: null; error: string }> {
  try {
    const result = await prisma.$transaction(fn, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    return { result, error: null };
  } catch (error) {
    if (error instanceof SortieValidationError)
      return { result: null, error: error.message };
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

export type CreateSortiesResult = {
  error: string | null;
  // which fiche failed a non-sum validation (bad nombrePieces/etc) so the
  // client can jump straight to it instead of leaving the user to guess
  // which of several fiches is at fault
  invalidCardId?: string;
};

// creates every fiche against one shared entrée in a single transaction:
// either all of them land, or none do. The sum of their nombrePieces is
// validated against the entrée's real piecesRestantes — an individual
// fiche's own max attribute only ever caps it at the full amount, since
// uncontrolled fiche inputs can't know live what the others currently hold
export async function createSorties(
  _prevState: CreateSortiesResult,
  formData: FormData,
): Promise<CreateSortiesResult> {
  await requireAuth();

  const entreeReference = String(formData.get("entreeReference") ?? "").trim();
  if (!entreeReference) return { error: "La référence est requise." };

  const cardIds = String(formData.get("cardIds") ?? "")
    .split(",")
    .filter(Boolean);
  if (cardIds.length === 0) return { error: "Ajoutez au moins une fiche." };

  const parsedCards: {
    cardId: string;
    data: NonNullable<ReturnType<typeof readSortieFormData>["data"]>;
  }[] = [];
  for (const cardId of cardIds) {
    const parsed = readSortieFormData(formData, cardId);
    if (parsed.error) return { error: parsed.error, invalidCardId: cardId };
    parsedCards.push({ cardId, data: parsed.data });
  }

  const totalNombrePieces = parsedCards.reduce(
    (sum, { data }) => sum + data.nombrePieces,
    0,
  );

  const outcome = await runSortieTransaction(async (tx) => {
    const piecesRestantes = await getPiecesRestantes(tx, entreeReference);
    if (piecesRestantes === null)
      throw new SortieValidationError("Cette référence n'existe pas.");
    if (totalNombrePieces > piecesRestantes)
      throw new SortieValidationError(
        `Il ne reste que ${piecesRestantes} pièce(s) disponible(s) pour cette référence.`,
      );

    return Promise.all(
      parsedCards.map(({ data }) =>
        tx.sortie.create({ data: { entreeReference, ...data } }),
      ),
    );
  });
  if (outcome.result === null) return { error: outcome.error };

  for (const sortie of outcome.result)
    await logHistory(HistoryItemType.CREATE_OUTPUT, toSortieSnapshot(sortie));
  revalidateStockPaths();
  return { error: null };
}

export async function updateSortie(
  id: number,
  _prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  await requireAuth();

  const parsed = readSortieFormData(formData);
  if (parsed.error) return { error: parsed.error };

  const outcome = await runSortieTransaction(async (tx) => {
    const existing = await tx.sortie.findUnique({ where: { id } });
    if (!existing)
      throw new SortieValidationError("Cette sortie n'existe pas.");

    const hasChanges =
      existing.nombrePieces !== parsed.data.nombrePieces ||
      existing.bonCommande !== parsed.data.bonCommande ||
      existing.commentaire !== parsed.data.commentaire ||
      existing.dateSortie.getTime() !== parsed.data.dateSortie.getTime();
    if (!hasChanges) return { existing, updated: null };

    const piecesRestantes = await getPiecesRestantes(
      tx,
      existing.entreeReference,
      id,
    );
    if (piecesRestantes === null)
      throw new SortieValidationError("Cette référence n'existe plus.");
    if (parsed.data.nombrePieces > piecesRestantes)
      throw new SortieValidationError(
        `Il ne reste que ${piecesRestantes} pièce(s) disponible(s) pour cette référence.`,
      );

    const updated = await tx.sortie.update({
      where: { id },
      data: parsed.data,
    });
    return { existing, updated };
  });
  if (outcome.result === null) return { error: outcome.error };

  if (outcome.result.updated) {
    await logHistory(HistoryItemType.UPDATE_OUTPUT, {
      before: toSortieSnapshot(outcome.result.existing),
      after: toSortieSnapshot(outcome.result.updated),
    });
    revalidateStockPaths();
  }
  return { error: null };
}

export async function deleteSortie(
  id: number,
): Promise<{ error: string | null }> {
  await requireAuth();

  const existing = await prisma.sortie.findUnique({ where: { id } });
  if (!existing) return { error: null };

  await prisma.sortie.delete({ where: { id } });

  await logHistory(HistoryItemType.DELETE_OUTPUT, toSortieSnapshot(existing));
  revalidateStockPaths();
  return { error: null };
}

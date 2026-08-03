"use server";

import { revalidatePath } from "next/cache";
import type { Sortie } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { HistoryItemType } from "@/generated/prisma/enums";
import { logHistory } from "@/utils/history";
import { prisma } from "@/utils/prisma";
import { requireAuth } from "@/utils/requireAuth";
import type { AvailableEntree } from "./types";

function toSortieSnapshot(sortie: Sortie) {
  return {
    entreeReference: sortie.entreeReference,
    nombrePieces: sortie.nombrePieces,
    bonCommande: sortie.bonCommande,
    dateSortie: sortie.dateSortie.toISOString(),
  };
}

// thrown inside a transaction to surface a validation message to the caller
// without it being mistaken for a real (retry-worthy) database error
class SortieValidationError extends Error {}

async function getPiecesRestantes(
  tx: Prisma.TransactionClient,
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
      nombrePieces: true,
      sorties: { select: { nombrePieces: true } },
    },
    orderBy: { reference: "asc" },
  });

  return entrees
    .map((entree) => ({
      reference: entree.reference,
      designation: entree.designation,
      piecesRestantes:
        entree.nombrePieces -
        entree.sorties.reduce((sum, sortie) => sum + sortie.nombrePieces, 0),
    }))
    .filter((entree) => entree.piecesRestantes > 0);
}

function readSortieFormData(formData: FormData) {
  const bonCommande = String(formData.get("bonCommande") ?? "").trim();
  const dateSortie = String(formData.get("dateSortie") ?? "");
  const nombrePieces = Number(formData.get("nombrePieces"));

  if (!Number.isInteger(nombrePieces) || nombrePieces <= 0)
    return { error: "Le nombre de pièces est invalide." as const };

  return {
    data: {
      nombrePieces,
      bonCommande: bonCommande || null,
      dateSortie: dateSortie ? new Date(dateSortie) : new Date(),
    },
  };
}

async function runSortieTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
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

export async function createSortie(
  _prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  await requireAuth();

  const entreeReference = String(formData.get("entreeReference") ?? "").trim();
  if (!entreeReference) return { error: "La référence est requise." };

  const parsed = readSortieFormData(formData);
  if (parsed.error) return { error: parsed.error };

  const outcome = await runSortieTransaction(async (tx) => {
    const piecesRestantes = await getPiecesRestantes(tx, entreeReference);
    if (piecesRestantes === null)
      throw new SortieValidationError("Cette référence n'existe pas.");
    if (parsed.data.nombrePieces > piecesRestantes)
      throw new SortieValidationError(
        `Il ne reste que ${piecesRestantes} pièce(s) disponible(s) pour cette référence.`,
      );

    return tx.sortie.create({ data: { entreeReference, ...parsed.data } });
  });
  if (outcome.result === null) return { error: outcome.error };

  await logHistory(
    HistoryItemType.CREATE_OUTPUT,
    toSortieSnapshot(outcome.result),
  );
  revalidatePath("/entrees");
  revalidatePath("/sorties");
  revalidatePath("/stock");
  revalidatePath("/historique");
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

  await logHistory(HistoryItemType.UPDATE_OUTPUT, {
    before: toSortieSnapshot(outcome.result.existing),
    after: toSortieSnapshot(outcome.result.updated),
  });
  revalidatePath("/entrees");
  revalidatePath("/sorties");
  revalidatePath("/stock");
  revalidatePath("/historique");
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
  revalidatePath("/entrees");
  revalidatePath("/sorties");
  revalidatePath("/stock");
  revalidatePath("/historique");
  return { error: null };
}

"use server";

import { revalidatePath } from "next/cache";
import type { Entree } from "@/generated/prisma/client";
import { HistoryItemType } from "@/generated/prisma/enums";
import { logHistory } from "@/utils/history";
import { LENGTH_UNITS, type LengthUnit, lengthToMeters } from "@/utils/length";
import { prisma } from "@/utils/prisma";
import { requireAuth } from "@/utils/requireAuth";

function toEntreeSnapshot(entree: Entree) {
  return {
    reference: entree.reference,
    designation: entree.designation,
    origine: entree.origine,
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

export type EntreeDetails = {
  reference: string;
  designation: string;
  date: string;
  origine: string | null;
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
  const date = String(formData.get(key("date")) ?? "");
  const longueurValue = Number(formData.get(key("longueurValue")));
  const longueurUnit = String(formData.get(key("longueurUnit")));
  const largeurValue = Number(formData.get(key("largeurValue")));
  const largeurUnit = String(formData.get(key("largeurUnit")));
  const nombrePieces = Number(formData.get(key("nombrePieces")));

  if (!designation) return { error: "La désignation est requise." as const };
  if (!reference) return { error: "La référence est requise." as const };
  if (!Number.isFinite(longueurValue) || longueurValue <= 0)
    return { error: "La longueur est invalide." as const };
  if (!isLengthUnit(longueurUnit))
    return { error: "L'unité de longueur est invalide." as const };
  if (!Number.isFinite(largeurValue) || largeurValue <= 0)
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
    if (parsed.error) return { error: parsed.error };
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

  const existing = await prisma.entree.findMany({
    where: { reference: { in: [...referencesSoFar] } },
    select: { reference: true },
  });
  if (existing.length > 0)
    return {
      error: `La référence "${existing[0].reference}" existe déjà.`,
      duplicateReference: existing[0].reference,
    };

  const created = await prisma.$transaction(
    parsedCards.map(({ data }) => prisma.entree.create({ data })),
  );

  for (const entree of created)
    await logHistory(HistoryItemType.CREATE_INPUT, toEntreeSnapshot(entree));
  revalidatePath("/entrees");
  revalidatePath("/sorties");
  revalidatePath("/stock");
  revalidatePath("/historique");
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

  const existing = await prisma.entree.findUnique({
    where: { reference: originalReference },
    include: { sorties: { select: { id: true } } },
  });
  if (!existing) return { error: "Cette entrée n'existe pas." };
  if (existing.sorties.length > 0)
    return {
      error:
        "Cette entrée a déjà une sortie associée, elle ne peut plus être modifiée.",
    };

  const updated = await prisma.entree.update({
    where: { reference: originalReference },
    data: {
      designation: parsed.data.designation,
      origine: parsed.data.origine,
      date: parsed.data.date,
      longueur: parsed.data.longueur,
      largeur: parsed.data.largeur,
      nombrePieces: parsed.data.nombrePieces,
    },
  });

  await logHistory(HistoryItemType.UPDATE_INPUT, {
    before: toEntreeSnapshot(existing),
    after: toEntreeSnapshot(updated),
  });
  revalidatePath("/entrees");
  revalidatePath("/sorties");
  revalidatePath("/stock");
  revalidatePath("/historique");
  return { error: null };
}

export async function deleteEntree(
  reference: string,
): Promise<{ error: string | null }> {
  await requireAuth();

  const existing = await prisma.entree.findUnique({
    where: { reference },
    include: { sorties: { select: { id: true } } },
  });
  if (!existing) return { error: null };
  if (existing.sorties.length > 0)
    return {
      error:
        "Cette entrée a déjà une sortie associée, elle ne peut pas être supprimée.",
    };

  await prisma.entree.delete({ where: { reference } });

  await logHistory(HistoryItemType.DELETE_INPUT, toEntreeSnapshot(existing));
  revalidatePath("/entrees");
  revalidatePath("/sorties");
  revalidatePath("/stock");
  revalidatePath("/historique");
  return { error: null };
}

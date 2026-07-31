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

function isLengthUnit(value: string): value is LengthUnit {
  return (LENGTH_UNITS as readonly string[]).includes(value);
}

function readEntreeFormData(formData: FormData) {
  const designation = String(formData.get("designation") ?? "").trim();
  const reference = String(formData.get("reference") ?? "").trim();
  const origine = String(formData.get("origine") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const longueurValue = Number(formData.get("longueurValue"));
  const longueurUnit = String(formData.get("longueurUnit"));
  const largeurValue = Number(formData.get("largeurValue"));
  const largeurUnit = String(formData.get("largeurUnit"));
  const nombrePieces = Number(formData.get("nombrePieces"));

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

export async function createEntree(
  _prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  await requireAuth();

  const parsed = readEntreeFormData(formData);
  if (parsed.error) return { error: parsed.error };

  let created: Entree;
  try {
    created = await prisma.entree.create({ data: parsed.data });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002")
      return { error: "Cette référence existe déjà." };
    throw error;
  }

  await logHistory(HistoryItemType.CREATE_INPUT, toEntreeSnapshot(created));
  revalidatePath("/entrees");
  revalidatePath("/stock");
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
    include: { sortie: { select: { entreeReference: true } } },
  });
  if (!existing) return { error: "Cette entrée n'existe pas." };
  if (existing.sortie)
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
  revalidatePath("/stock");
  return { error: null };
}

export async function deleteEntree(
  reference: string,
): Promise<{ error: string | null }> {
  await requireAuth();

  const existing = await prisma.entree.findUnique({
    where: { reference },
    include: { sortie: { select: { entreeReference: true } } },
  });
  if (!existing) return { error: null };
  if (existing.sortie)
    return {
      error:
        "Cette entrée a déjà une sortie associée, elle ne peut pas être supprimée.",
    };

  await prisma.entree.delete({ where: { reference } });

  await logHistory(HistoryItemType.DELETE_INPUT, toEntreeSnapshot(existing));
  revalidatePath("/entrees");
  revalidatePath("/stock");
  return { error: null };
}

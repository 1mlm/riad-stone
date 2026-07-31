"use server";

import { revalidatePath } from "next/cache";
import type { Sortie } from "@/generated/prisma/client";
import { HistoryItemType } from "@/generated/prisma/enums";
import { logHistory } from "@/utils/history";
import { prisma } from "@/utils/prisma";
import { requireAuth } from "@/utils/requireAuth";
import type { AvailableEntree } from "./types";

function toSortieSnapshot(sortie: Sortie) {
  return {
    entreeReference: sortie.entreeReference,
    bonCommande: sortie.bonCommande,
    dateSortie: sortie.dateSortie.toISOString(),
  };
}

export async function getAvailableEntrees(): Promise<AvailableEntree[]> {
  const rows = await prisma.entree.findMany({
    where: { sortie: null },
    select: { reference: true, designation: true },
    orderBy: { reference: "asc" },
  });
  return rows;
}

export async function createSortie(
  _prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  await requireAuth();

  const entreeReference = String(formData.get("entreeReference") ?? "").trim();
  const bonCommande = String(formData.get("bonCommande") ?? "").trim();
  const dateSortie = String(formData.get("dateSortie") ?? "");

  if (!entreeReference) return { error: "La référence est requise." };

  const entree = await prisma.entree.findUnique({
    where: { reference: entreeReference },
    select: {
      designation: true,
      sortie: { select: { entreeReference: true } },
    },
  });
  if (!entree) return { error: "Cette référence n'existe pas." };
  if (entree.sortie) return { error: "Cette entrée a déjà été sortie." };

  const created = await prisma.sortie.create({
    data: {
      entreeReference,
      bonCommande: bonCommande || null,
      dateSortie: dateSortie ? new Date(dateSortie) : new Date(),
    },
  });

  await logHistory(HistoryItemType.CREATE_OUTPUT, toSortieSnapshot(created));
  revalidatePath("/sorties");
  revalidatePath("/stock");
  return { error: null };
}

export async function updateSortie(
  entreeReference: string,
  _prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  await requireAuth();

  const bonCommande = String(formData.get("bonCommande") ?? "").trim();
  const dateSortie = String(formData.get("dateSortie") ?? "");

  const existing = await prisma.sortie.findUnique({
    where: { entreeReference },
  });
  if (!existing) return { error: "Cette sortie n'existe pas." };

  const updated = await prisma.sortie.update({
    where: { entreeReference },
    data: {
      bonCommande: bonCommande || null,
      dateSortie: dateSortie ? new Date(dateSortie) : new Date(),
    },
  });

  await logHistory(HistoryItemType.UPDATE_OUTPUT, {
    before: toSortieSnapshot(existing),
    after: toSortieSnapshot(updated),
  });
  revalidatePath("/sorties");
  return { error: null };
}

export async function deleteSortie(
  entreeReference: string,
): Promise<{ error: string | null }> {
  await requireAuth();

  const existing = await prisma.sortie.findUnique({
    where: { entreeReference },
  });
  if (!existing) return { error: null };

  await prisma.sortie.delete({ where: { entreeReference } });

  await logHistory(HistoryItemType.DELETE_OUTPUT, toSortieSnapshot(existing));
  revalidatePath("/sorties");
  revalidatePath("/stock");
  return { error: null };
}

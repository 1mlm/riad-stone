"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { HistoryItemType } from "@/generated/prisma/enums";
import { AUTH_COOKIE_NAME } from "@/utils/auth";
import { logHistory } from "@/utils/history";
import { prisma } from "@/utils/prisma";
import { requireAuth } from "@/utils/requireAuth";

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  await logHistory(HistoryItemType.LOGOUT, {});
  redirect("/gate");
}

export async function isStockEmpty(): Promise<boolean> {
  const [entreeCount, sortieCount] = await Promise.all([
    prisma.entree.count(),
    prisma.sortie.count(),
  ]);
  return entreeCount === 0 && sortieCount === 0;
}

export async function clearAllData(): Promise<void> {
  await requireAuth();

  const [entreesCleared, sortiesCleared] = await Promise.all([
    prisma.entree.count(),
    prisma.sortie.count(),
  ]);

  await prisma.sortie.deleteMany();
  await prisma.entree.deleteMany();

  await logHistory(HistoryItemType.CLEAR_EVERYTHING, {
    entreesCleared,
    sortiesCleared,
  });
  revalidatePath("/entrees");
  revalidatePath("/sorties");
  revalidatePath("/stock");
  revalidatePath("/historique");
}

const FAKE_ENTREES = [
  {
    reference: "TZ01",
    designation: "Granite Blanc",
    origine: "Maroc",
    longueur: 0.6,
    largeur: 0.4,
    nombrePieces: 40,
  },
  {
    reference: "TZ02",
    designation: "Marbre Ibiza",
    origine: "Espagne",
    longueur: 0.3,
    largeur: 0.3,
    nombrePieces: 120,
  },
  {
    reference: "TZ03",
    designation: "Granite Gris",
    origine: "Maroc",
    longueur: 0.6,
    largeur: 0.6,
    nombrePieces: 25,
  },
  {
    reference: "TZ04",
    designation: "Travertin Beige",
    origine: "Turquie",
    longueur: 0.4,
    largeur: 0.4,
    nombrePieces: 60,
  },
  {
    reference: "TZ05",
    designation: "Granite Noir",
    origine: "Inde",
    longueur: 0.6,
    largeur: 0.3,
    nombrePieces: 80,
  },
  {
    reference: "TZ06",
    designation: "Marbre Carrare",
    origine: "Italie",
    longueur: 0.6,
    largeur: 0.4,
    nombrePieces: 30,
  },
  {
    reference: "TZ07",
    designation: "Granite Tan Brown",
    origine: "Inde",
    longueur: 0.3,
    largeur: 0.3,
    nombrePieces: 150,
  },
  {
    reference: "TZ08",
    designation: "Travertin Noce",
    origine: "Turquie",
    longueur: 0.4,
    largeur: 0.4,
    nombrePieces: 45,
  },
  {
    reference: "TZ09",
    designation: "Marbre Emperador",
    origine: "Espagne",
    longueur: 0.6,
    largeur: 0.3,
    nombrePieces: 70,
  },
  {
    reference: "TZ10",
    designation: "Granite Rose",
    origine: "Maroc",
    longueur: 0.6,
    largeur: 0.6,
    nombrePieces: 20,
  },
];

const FAKE_SORTIES = [
  { entreeReference: "TZ02", nombrePieces: 40, bonCommande: "C100000001" },
  { entreeReference: "TZ05", nombrePieces: 80, bonCommande: "C100000002" },
  { entreeReference: "TZ07", nombrePieces: 60, bonCommande: "C100000003" },
  { entreeReference: "TZ09", nombrePieces: 70, bonCommande: "C100000004" },
];

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

// covers every HistoryItemType with a representative snapshot shape, so the
// historique page can be reviewed against every combination at once
const FAKE_HISTORY_EVENTS: {
  type: HistoryItemType;
  data: Prisma.InputJsonObject;
  createdAt: Date;
}[] = [
  {
    type: HistoryItemType.CREATE_INPUT,
    data: {
      reference: "TZ01",
      designation: "Granite Blanc",
      origine: "Maroc",
      date: daysAgo(0).toISOString(),
      longueur: 0.6,
      largeur: 0.4,
      nombrePieces: 40,
    },
    createdAt: daysAgo(0),
  },
  {
    type: HistoryItemType.UPDATE_INPUT,
    data: {
      before: {
        reference: "TZ03",
        designation: "Granite Gris",
        origine: "Maroc",
        date: daysAgo(1).toISOString(),
        longueur: 0.6,
        largeur: 0.6,
        nombrePieces: 25,
      },
      after: {
        reference: "TZ03",
        designation: "Granite Gris",
        origine: "Maroc",
        date: daysAgo(1).toISOString(),
        longueur: 0.6,
        largeur: 0.6,
        nombrePieces: 32,
      },
    },
    createdAt: daysAgo(1),
  },
  {
    type: HistoryItemType.DELETE_INPUT,
    data: {
      reference: "TZ11",
      designation: "Onyx Vert",
      origine: "Iran",
      date: daysAgo(3).toISOString(),
      longueur: 0.3,
      largeur: 0.3,
      nombrePieces: 15,
    },
    createdAt: daysAgo(3),
  },
  {
    type: HistoryItemType.CREATE_OUTPUT,
    data: {
      entreeReference: "TZ02",
      nombrePieces: 40,
      bonCommande: "C100000001",
      dateSortie: daysAgo(4).toISOString(),
    },
    createdAt: daysAgo(4),
  },
  {
    type: HistoryItemType.UPDATE_OUTPUT,
    data: {
      before: {
        entreeReference: "TZ05",
        nombrePieces: 80,
        bonCommande: "C100000002",
        dateSortie: daysAgo(6).toISOString(),
      },
      after: {
        entreeReference: "TZ05",
        nombrePieces: 80,
        bonCommande: "C100000099",
        dateSortie: daysAgo(6).toISOString(),
      },
    },
    createdAt: daysAgo(6),
  },
  {
    type: HistoryItemType.DELETE_OUTPUT,
    data: {
      entreeReference: "TZ12",
      nombrePieces: 30,
      bonCommande: "C100000050",
      dateSortie: daysAgo(10).toISOString(),
    },
    createdAt: daysAgo(10),
  },
  {
    type: HistoryItemType.LOGIN,
    data: { code: "pipi" },
    createdAt: daysAgo(15),
  },
  {
    type: HistoryItemType.LOGOUT,
    data: {},
    createdAt: daysAgo(15),
  },
  {
    type: HistoryItemType.CLEAR_EVERYTHING,
    data: { entreesCleared: 8, sortiesCleared: 3 },
    createdAt: daysAgo(45),
  },
];

export async function seedFakeData(): Promise<void> {
  await requireAuth();

  if (!(await isStockEmpty())) return;

  await prisma.entree.createMany({ data: FAKE_ENTREES });
  await prisma.sortie.createMany({ data: FAKE_SORTIES });
  await prisma.historyEvent.createMany({ data: FAKE_HISTORY_EVENTS });

  await logHistory(HistoryItemType.SEED_FAKE_DATA, {
    entreesCreated: FAKE_ENTREES.length,
    sortiesCreated: FAKE_SORTIES.length,
  });
  revalidatePath("/entrees");
  revalidatePath("/sorties");
  revalidatePath("/stock");
  revalidatePath("/historique");
}

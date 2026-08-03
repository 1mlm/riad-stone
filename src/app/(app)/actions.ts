"use server";

import { faker } from "@faker-js/faker";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { HistoryItemType } from "@/generated/prisma/enums";
import { AUTH_COOKIE_NAME } from "@/utils/auth";
import { logHistory } from "@/utils/history";
import { prisma } from "@/utils/prisma";
import { requireAuth } from "@/utils/requireAuth";
import { describeUserAgent } from "@/utils/userAgent";

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  const userAgent = describeUserAgent((await headers()).get("user-agent"));
  await logHistory(HistoryItemType.LOGOUT, { userAgent });
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

// designations are repeated on purpose (e.g. 6x Ibiza, 4x Granite Blanc) so
// the stock table has enough duplicate rows to exercise cell-merge rendering
const DESIGNATION_POOL: { designation: string; origine: string }[] = [
  ...Array(6).fill({ designation: "Marbre Ibiza", origine: "Espagne" }),
  ...Array(4).fill({ designation: "Granite Blanc", origine: "Maroc" }),
  ...Array(2).fill({ designation: "Granite Gris", origine: "Maroc" }),
  { designation: "Travertin Beige", origine: "Turquie" },
  { designation: "Granite Noir", origine: "Inde" },
  { designation: "Marbre Carrare", origine: "Italie" },
  { designation: "Granite Tan Brown", origine: "Inde" },
  { designation: "Travertin Noce", origine: "Turquie" },
  { designation: "Marbre Emperador", origine: "Espagne" },
];

const DIMENSIONS: [number, number][] = [
  [0.3, 0.3],
  [0.4, 0.4],
  [0.6, 0.3],
  [0.6, 0.4],
  [0.6, 0.6],
];

function buildFakeEntrees() {
  faker.seed(1312);

  return faker.helpers
    .shuffle(DESIGNATION_POOL)
    .map(({ designation, origine }, index) => {
      const [longueur, largeur] = faker.helpers.arrayElement(DIMENSIONS);
      return {
        reference: `TZ${String(index + 1).padStart(2, "0")}`,
        designation,
        origine,
        date: faker.date.past({ years: 1 }),
        longueur,
        largeur,
        nombrePieces: faker.number.int({ min: 15, max: 200 }),
      };
    });
}

function buildFakeSorties(entrees: ReturnType<typeof buildFakeEntrees>) {
  return faker.helpers
    .arrayElements(entrees, { min: 4, max: 6 })
    .map((entree) => ({
      entreeReference: entree.reference,
      nombrePieces: faker.number.int({ min: 1, max: entree.nombrePieces }),
      bonCommande: `C1${faker.string.numeric(8)}`,
      dateSortie: faker.date.between({ from: entree.date, to: new Date() }),
    }));
}

// covers every entree/sortie HistoryItemType with a representative snapshot
// shape, so the historique page can be reviewed against every combination
// at once — deliberately excludes LOGIN/LOGOUT/CLEAR_EVERYTHING, since those
// are meant to be a real security audit trail and faking them would make a
// fabricated login/logout/wipe indistinguishable from a real one
function buildFakeHistoryEvents(
  entrees: ReturnType<typeof buildFakeEntrees>,
  sorties: ReturnType<typeof buildFakeSorties>,
): { type: HistoryItemType; data: Prisma.InputJsonObject; createdAt: Date }[] {
  const [createdEntree, updatedEntreeBefore, deletedEntree] = entrees;
  const [createdSortie, updatedSortieBefore] = sorties;

  const entreeSnapshot = (entree: (typeof entrees)[number]) => ({
    reference: entree.reference,
    designation: entree.designation,
    origine: entree.origine,
    date: entree.date.toISOString(),
    longueur: entree.longueur,
    largeur: entree.largeur,
    nombrePieces: entree.nombrePieces,
  });

  const sortieSnapshot = (sortie: (typeof sorties)[number]) => ({
    entreeReference: sortie.entreeReference,
    nombrePieces: sortie.nombrePieces,
    bonCommande: sortie.bonCommande,
    dateSortie: sortie.dateSortie.toISOString(),
  });

  return [
    {
      type: HistoryItemType.CREATE_INPUT,
      data: entreeSnapshot(createdEntree),
      createdAt: createdEntree.date,
    },
    {
      type: HistoryItemType.UPDATE_INPUT,
      data: {
        before: entreeSnapshot(updatedEntreeBefore),
        after: {
          ...entreeSnapshot(updatedEntreeBefore),
          nombrePieces: updatedEntreeBefore.nombrePieces + 7,
        },
      },
      createdAt: faker.date.soon({
        days: 1,
        refDate: updatedEntreeBefore.date,
      }),
    },
    {
      type: HistoryItemType.DELETE_INPUT,
      data: entreeSnapshot(deletedEntree),
      createdAt: faker.date.soon({ days: 2, refDate: deletedEntree.date }),
    },
    {
      type: HistoryItemType.CREATE_OUTPUT,
      data: sortieSnapshot(createdSortie),
      createdAt: createdSortie.dateSortie,
    },
    {
      type: HistoryItemType.UPDATE_OUTPUT,
      data: {
        before: sortieSnapshot(updatedSortieBefore),
        after: {
          ...sortieSnapshot(updatedSortieBefore),
          bonCommande: `C1${faker.string.numeric(8)}`,
        },
      },
      createdAt: faker.date.soon({
        days: 1,
        refDate: updatedSortieBefore.dateSortie,
      }),
    },
    {
      type: HistoryItemType.DELETE_OUTPUT,
      data: sortieSnapshot(updatedSortieBefore),
      createdAt: faker.date.soon({
        days: 3,
        refDate: updatedSortieBefore.dateSortie,
      }),
    },
  ];
}

export async function seedFakeData(): Promise<void> {
  await requireAuth();

  if (!(await isStockEmpty())) return;

  const entrees = buildFakeEntrees();
  const sorties = buildFakeSorties(entrees);
  const historyEvents = buildFakeHistoryEvents(entrees, sorties);

  await prisma.entree.createMany({ data: entrees });
  await prisma.sortie.createMany({ data: sorties });
  await prisma.historyEvent.createMany({ data: historyEvents });

  await logHistory(HistoryItemType.SEED_FAKE_DATA, {
    entreesCreated: entrees.length,
    sortiesCreated: sorties.length,
  });
  revalidatePath("/entrees");
  revalidatePath("/sorties");
  revalidatePath("/stock");
  revalidatePath("/historique");
}

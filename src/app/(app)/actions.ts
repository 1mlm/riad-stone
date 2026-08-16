"use server";

import { faker } from "@faker-js/faker";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { HistoryItemType } from "@/generated/prisma/enums";
import { AUTH_COOKIE_NAME } from "@/utils/auth";
import { buildDeviceInfo } from "@/utils/deviceInfo";
import { logHistory } from "@/utils/history";
import { prisma } from "@/utils/prisma";
import { requireAuth } from "@/utils/requireAuth";
import { revalidateStockPaths } from "@/utils/revalidate";

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  const userAgent = buildDeviceInfo(await headers());
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
  revalidateStockPaths();
}

// pool is small on purpose, drawn from repeatedly below — that's what
// produces the duplicate designations the stock table's cell-merge
// rendering needs to be exercised
const DESIGNATION_POOL: { designation: string; origine: string }[] = [
  { designation: "Marbre Ibiza", origine: "Espagne" },
  { designation: "Granite Blanc", origine: "Maroc" },
  { designation: "Granite Gris", origine: "Maroc" },
  { designation: "Travertin Beige", origine: "Turquie" },
  { designation: "Granite Noir", origine: "Inde" },
  { designation: "Marbre Carrare", origine: "Italie" },
  { designation: "Granite Tan Brown", origine: "Inde" },
  { designation: "Travertin Noce", origine: "Turquie" },
  { designation: "Marbre Emperador", origine: "Espagne" },
  { designation: "Marbre Calacatta", origine: "Italie" },
];

const DIMENSIONS: [number, number][] = [
  [0.3, 0.3],
  [0.4, 0.4],
  [0.6, 0.3],
  [0.6, 0.4],
  [0.6, 0.6],
];

// large enough that every table (entrees, sorties, historique) spans
// several pages, so pagination/filtering/sorting can actually be exercised
const ENTREE_COUNT = 140;
const SORTIE_RATIO = 0.6;

function buildFakeEntrees() {
  faker.seed(1312);

  return Array.from({ length: ENTREE_COUNT }, (_, index) => {
    const { designation, origine } =
      faker.helpers.arrayElement(DESIGNATION_POOL);
    const [longueur, largeur] = faker.helpers.arrayElement(DIMENSIONS);
    return {
      reference: `TZ${String(index + 1).padStart(3, "0")}`,
      designation,
      origine,
      conteneur: faker.datatype.boolean()
        ? faker.string.alphanumeric(8).toUpperCase()
        : null,
      date: faker.date.past({ years: 1 }),
      longueur,
      largeur,
      nombrePieces: faker.number.int({ min: 15, max: 200 }),
    };
  });
}

function buildFakeSorties(entrees: ReturnType<typeof buildFakeEntrees>) {
  return faker.helpers
    .arrayElements(entrees, Math.round(entrees.length * SORTIE_RATIO))
    .map((entree) => ({
      entreeReference: entree.reference,
      nombrePieces: faker.number.int({ min: 1, max: entree.nombrePieces }),
      bonCommande: `C1${faker.string.numeric(8)}`,
      dateSortie: faker.date.between({ from: entree.date, to: new Date() }),
    }));
}

// one CREATE per entree/sortie plus a sprinkling of UPDATE/DELETE, so the
// historique page gets as many pages of data as entrees/sorties do —
// deliberately excludes LOGIN/LOGOUT/CLEAR_EVERYTHING, since those are meant
// to be a real security audit trail and faking them would make a fabricated
// login/logout/wipe indistinguishable from a real one
function buildFakeHistoryEvents(
  entrees: ReturnType<typeof buildFakeEntrees>,
  sorties: ReturnType<typeof buildFakeSorties>,
): { type: HistoryItemType; data: Prisma.InputJsonObject; createdAt: Date }[] {
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

  type FakeHistoryEvent = {
    type: HistoryItemType;
    data: Prisma.InputJsonObject;
    createdAt: Date;
  };

  const entreeEvents = entrees.flatMap((entree, index) => {
    const events: FakeHistoryEvent[] = [
      {
        type: HistoryItemType.CREATE_INPUT,
        data: entreeSnapshot(entree),
        createdAt: entree.date,
      },
    ];
    if (index % 6 === 0)
      events.push({
        type: HistoryItemType.UPDATE_INPUT,
        data: {
          before: entreeSnapshot(entree),
          after: {
            ...entreeSnapshot(entree),
            nombrePieces: entree.nombrePieces + 7,
          },
        },
        createdAt: faker.date.soon({ days: 1, refDate: entree.date }),
      });
    if (index % 11 === 0)
      events.push({
        type: HistoryItemType.DELETE_INPUT,
        data: entreeSnapshot(entree),
        createdAt: faker.date.soon({ days: 2, refDate: entree.date }),
      });
    return events;
  });

  const sortieEvents = sorties.flatMap((sortie, index) => {
    const events: FakeHistoryEvent[] = [
      {
        type: HistoryItemType.CREATE_OUTPUT,
        data: sortieSnapshot(sortie),
        createdAt: sortie.dateSortie,
      },
    ];
    if (index % 7 === 0)
      events.push({
        type: HistoryItemType.UPDATE_OUTPUT,
        data: {
          before: sortieSnapshot(sortie),
          after: {
            ...sortieSnapshot(sortie),
            bonCommande: `C1${faker.string.numeric(8)}`,
          },
        },
        createdAt: faker.date.soon({ days: 1, refDate: sortie.dateSortie }),
      });
    if (index % 13 === 0)
      events.push({
        type: HistoryItemType.DELETE_OUTPUT,
        data: sortieSnapshot(sortie),
        createdAt: faker.date.soon({ days: 3, refDate: sortie.dateSortie }),
      });
    return events;
  });

  return [...entreeEvents, ...sortieEvents];
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
  revalidateStockPaths();
}

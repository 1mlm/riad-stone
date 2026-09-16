import type { HistoryEvent, Prisma } from "@/generated/prisma/client";
import { HistoryItemType } from "@/generated/prisma/enums";
import { getEventReference } from "@/utils/historySnapshot";
import { prisma } from "@/utils/prisma";

export async function logHistory(
  type: HistoryItemType,
  data: Prisma.InputJsonObject,
): Promise<void> {
  await prisma.historyEvent.create({ data: { type, data } });
}

// everything created in one submit still gets its own event, so each lot
// keeps its own creation row in its own timeline (see
// getHistoryEventsForReference below, which matches on the reference inside
// the snapshot). They're written with one shared createdAt rather than
// letting each row default to its own now(): that exact shared timestamp is
// what lets the historique list collapse them back into a single line. Left
// to now() they land milliseconds apart and a batch straddling a second
// boundary would show up as two
export async function logHistoryBatch(
  type: HistoryItemType,
  items: Prisma.InputJsonObject[],
): Promise<void> {
  if (items.length === 0) return;
  const createdAt = new Date();
  await prisma.historyEvent.createMany({
    data: items.map((data) => ({ type, data, createdAt })),
  });
}

// references are reusable (an entree can be deleted and a new, unrelated
// one later created with the same reference string) — since events carry
// no foreign key back to a specific entree row, only string-match the
// reference, so a stale reference would otherwise blend two lots'
// histories into one timeline. Cuts the list off at the most recent
// CREATE_INPUT for that reference: everything older belonged to a prior
// lot that reused the same string.
export async function getHistoryEventsForReference(
  reference: string,
): Promise<HistoryEvent[]> {
  const events = await prisma.historyEvent.findMany({
    orderBy: { createdAt: "desc" },
  });
  const matching = events.filter(
    (event) => getEventReference(event.type, event.data) === reference,
  );
  const latestCreateIndex = matching.findIndex(
    (event) => event.type === HistoryItemType.CREATE_INPUT,
  );
  return latestCreateIndex === -1
    ? matching
    : matching.slice(0, latestCreateIndex + 1);
}

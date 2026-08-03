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

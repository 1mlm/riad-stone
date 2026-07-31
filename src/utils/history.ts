import type { HistoryEvent, Prisma } from "@/generated/prisma/client";
import { HistoryItemType } from "@/generated/prisma/enums";
import { prisma } from "@/utils/prisma";

export async function logHistory(
  type: HistoryItemType,
  data: Prisma.InputJsonObject,
): Promise<void> {
  await prisma.historyEvent.create({ data: { type, data } });
}

export type HistorySnapshot = Record<string, unknown>;

const UPDATE_TYPES: HistoryItemType[] = [
  HistoryItemType.UPDATE_INPUT,
  HistoryItemType.UPDATE_OUTPUT,
];

// UPDATE_* events store { before, after }, everything else stores the row
// snapshot directly — this is the one place that distinction is resolved
export function getEventSnapshots(
  type: HistoryItemType,
  data: unknown,
): { before?: HistorySnapshot; current: HistorySnapshot } {
  if (UPDATE_TYPES.includes(type)) {
    const { before, after } = data as {
      before: HistorySnapshot;
      after: HistorySnapshot;
    };
    return { before, current: after };
  }
  return { current: data as HistorySnapshot };
}

// entree events key off "reference", sortie events off "entreeReference" —
// this is the one place that resolves which snapshot field to read
export function getEventReference(
  type: HistoryItemType,
  data: unknown,
): string | undefined {
  const { current } = getEventSnapshots(type, data);
  const reference = current.reference ?? current.entreeReference;
  return typeof reference === "string" && reference ? reference : undefined;
}

export async function getHistoryEventsForReference(
  reference: string,
): Promise<HistoryEvent[]> {
  const events = await prisma.historyEvent.findMany({
    orderBy: { createdAt: "desc" },
  });
  return events.filter(
    (event) => getEventReference(event.type, event.data) === reference,
  );
}

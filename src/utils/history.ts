import type { HistoryEvent, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/utils/prisma";
import { getEventReference } from "@/utils/historySnapshot";
import type { HistoryItemType } from "@/generated/prisma/enums";

export async function logHistory(
  type: HistoryItemType,
  data: Prisma.InputJsonObject,
): Promise<void> {
  await prisma.historyEvent.create({ data: { type, data } });
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

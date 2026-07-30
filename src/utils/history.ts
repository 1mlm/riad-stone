import type { Prisma } from "@/generated/prisma/client";
import type { HistoryItemType } from "@/generated/prisma/enums";
import { prisma } from "@/utils/prisma";

export async function logHistory(
  type: HistoryItemType,
  data: Prisma.InputJsonObject,
): Promise<void> {
  await prisma.historyEvent.create({ data: { type, data } });
}

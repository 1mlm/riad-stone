"use server";

import type { HistoryEvent } from "@/generated/prisma/client";
import { isCodeCorrect } from "@/utils/auth";
import { getHistoryEventsForReference } from "@/utils/history";
import { requireAuth } from "@/utils/requireAuth";

export async function verifyRevealCode(code: string): Promise<boolean> {
  await requireAuth();
  return isCodeCorrect(code);
}

export async function getHistoryForReference(
  reference: string,
): Promise<HistoryEvent[]> {
  await requireAuth();
  return getHistoryEventsForReference(reference);
}

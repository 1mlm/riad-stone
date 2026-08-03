"use server";

import type { HistoryEvent } from "@/generated/prisma/client";
import { isCodeCorrect } from "@/utils/auth";
import { getHistoryEventsForReference } from "@/utils/history";
import { prisma } from "@/utils/prisma";
import { requireAuth } from "@/utils/requireAuth";

// the "code" field on a LOGIN event is the app's own shared login secret —
// only return the plaintext once the caller has proven they already know
// it, so it's never sent to the client before that point (a CSS blur alone
// wouldn't stop devtools/view-source from reading it straight off the page)
export async function revealHistoryCode(
  eventId: number,
  guess: string,
): Promise<string | null> {
  await requireAuth();
  if (!isCodeCorrect(guess)) return null;

  const event = await prisma.historyEvent.findUnique({
    where: { id: eventId },
  });
  const code = (event?.data as { code?: unknown } | null)?.code;
  return typeof code === "string" ? code : null;
}

export async function getHistoryForReference(
  reference: string,
): Promise<HistoryEvent[]> {
  await requireAuth();
  return getHistoryEventsForReference(reference);
}

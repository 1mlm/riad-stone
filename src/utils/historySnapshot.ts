import { HistoryItemType } from "@/generated/prisma/enums";

// pure event-shape helpers, kept separate from utils/history.ts so client
// components (e.g. HistoryEventList inside a popup dialog) can import these
// without dragging Prisma/pg (and its Node-only built-ins) into the browser bundle

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

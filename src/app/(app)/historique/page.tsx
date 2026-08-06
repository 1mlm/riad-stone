import { prisma } from "@/utils/prisma";
import { HistoryEventList } from "./HistoryEventList";

export default async function HistoriquePage() {
  const events = await prisma.historyEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return (
    <div className="flex min-w-0 flex-col gap-4 p-5">
      <HistoryEventList {...{ events }} />
    </div>
  );
}

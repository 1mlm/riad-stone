import { prisma } from "@/utils/prisma";
import { HistoryEventList } from "./HistoryEventList";

export default async function HistoriquePage() {
  const events = await prisma.historyEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 p-5">
      <HistoryEventList {...{ events }} />
    </div>
  );
}

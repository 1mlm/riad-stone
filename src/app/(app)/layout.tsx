import type { PropsWithChildren } from "react";
import { AppShell } from "@/components/sidebar/AppShell";
import { getStartOfDayInTimeZone } from "@/utils/date";
import { prisma } from "@/utils/prisma";

// counts depend on wall-clock "today" and must never be statically cached
export const dynamic = "force-dynamic";

const MOROCCO_TIME_ZONE = "Africa/Casablanca";

async function getStockCount() {
  const entrees = await prisma.entree.findMany({
    select: {
      nombrePieces: true,
      sorties: { select: { nombrePieces: true } },
    },
  });
  return entrees.filter(
    (entree) =>
      entree.nombrePieces -
        entree.sorties.reduce((sum, sortie) => sum + sortie.nombrePieces, 0) >
      0,
  ).length;
}

export default async function AppLayout({ children }: PropsWithChildren) {
  const [entrees, sorties, stock, historique] = await Promise.all([
    prisma.entree.count(),
    prisma.sortie.count(),
    getStockCount(),
    prisma.historyEvent.count({
      where: {
        createdAt: {
          gte: getStartOfDayInTimeZone(new Date(), MOROCCO_TIME_ZONE),
        },
      },
    }),
  ]);

  return (
    <AppShell counts={{ entrees, sorties, stock, historique }}>
      {children}
    </AppShell>
  );
}

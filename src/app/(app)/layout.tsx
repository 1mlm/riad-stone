import type { PropsWithChildren } from "react";
import { AppShell } from "@/components/sidebar/AppShell";
import { prisma } from "@/utils/prisma";

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
  const [entrees, sorties, stock] = await Promise.all([
    prisma.entree.count(),
    prisma.sortie.count(),
    getStockCount(),
  ]);

  return <AppShell counts={{ entrees, sorties, stock }}>{children}</AppShell>;
}

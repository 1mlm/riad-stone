import { prisma } from "@/utils/prisma";
import { StockTable } from "./StockTable";

export default async function StockPage() {
  const entrees = await prisma.entree.findMany({
    include: { sorties: { select: { nombrePieces: true } } },
    orderBy: { date: "desc" },
  });

  const rows = entrees
    .map((entree) => ({
      reference: entree.reference,
      designation: entree.designation,
      date: entree.date,
      origine: entree.origine,
      conteneur: entree.conteneur,
      longueur: Number(entree.longueur),
      largeur: Number(entree.largeur),
      nombrePieces:
        entree.nombrePieces -
        entree.sorties.reduce((sum, sortie) => sum + sortie.nombrePieces, 0),
    }))
    .filter((row) => row.nombrePieces > 0);

  return <StockTable items={rows} />;
}

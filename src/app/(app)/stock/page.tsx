import { prisma } from "@/utils/prisma";
import { StockTable } from "./StockTable";

export default async function StockPage() {
  const entrees = await prisma.entree.findMany({
    where: { sortie: null },
    orderBy: { date: "desc" },
  });

  const rows = entrees.map((entree) => ({
    reference: entree.reference,
    designation: entree.designation,
    date: entree.date,
    origine: entree.origine,
    longueur: Number(entree.longueur),
    largeur: Number(entree.largeur),
    nombrePieces: entree.nombrePieces,
  }));

  return <StockTable items={rows} />;
}

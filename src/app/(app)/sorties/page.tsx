import { prisma } from "@/utils/prisma";
import { getAvailableEntrees } from "./actions";
import { SortiesTable } from "./SortiesTable";

export default async function SortiesPage() {
  const [sorties, availableEntrees] = await Promise.all([
    prisma.sortie.findMany({
      include: { entree: true },
      orderBy: { dateSortie: "desc" },
    }),
    getAvailableEntrees(),
  ]);

  const rows = sorties.map((sortie) => ({
    entreeReference: sortie.entreeReference,
    designation: sortie.entree.designation,
    origine: sortie.entree.origine,
    dateEntree: sortie.entree.date,
    longueur: Number(sortie.entree.longueur),
    largeur: Number(sortie.entree.largeur),
    nombrePieces: sortie.entree.nombrePieces,
    dateSortie: sortie.dateSortie,
    bonCommande: sortie.bonCommande,
  }));

  return <SortiesTable items={rows} {...{ availableEntrees }} />;
}

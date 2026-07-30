import { prisma } from "@/utils/prisma";
import { getDesignationSuggestions } from "./actions";
import { EntreesTable } from "./EntreesTable";

export default async function EntreesPage() {
  const [entrees, designationSuggestions] = await Promise.all([
    prisma.entree.findMany({ orderBy: { date: "desc" } }),
    getDesignationSuggestions(),
  ]);

  const rows = entrees.map((entree) => ({
    reference: entree.reference,
    designation: entree.designation,
    date: entree.date,
    origine: entree.origine,
    longueur: Number(entree.longueur),
    largeur: Number(entree.largeur),
    nombrePieces: entree.nombrePieces,
  }));

  return <EntreesTable items={rows} {...{ designationSuggestions }} />;
}

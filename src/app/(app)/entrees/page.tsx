import { prisma } from "@/utils/prisma";
import {
  getDesignationSuggestions,
  getEntreeFieldSuggestions,
} from "./actions";
import { EntreesTable } from "./EntreesTable";

export default async function EntreesPage() {
  const [entrees, designationSuggestions, fieldSuggestions] = await Promise.all(
    [
      prisma.entree.findMany({ orderBy: { date: "desc" } }),
      getDesignationSuggestions(),
      getEntreeFieldSuggestions(),
    ],
  );

  const rows = entrees.map((entree) => ({
    reference: entree.reference,
    designation: entree.designation,
    date: entree.date,
    origine: entree.origine,
    conteneur: entree.conteneur,
    longueur: Number(entree.longueur),
    largeur: Number(entree.largeur),
    nombrePieces: entree.nombrePieces,
  }));

  return (
    <EntreesTable
      items={rows}
      {...{ designationSuggestions, fieldSuggestions }}
    />
  );
}

import { revalidatePath } from "next/cache";

// entrees/sorties/stock all derive from the same two tables, and historique
// logs every mutation to them — any entree/sortie create/update/delete/clear
// touches all four pages
export function revalidateStockPaths() {
  revalidatePath("/entrees");
  revalidatePath("/sorties");
  revalidatePath("/stock");
  revalidatePath("/historique");
}

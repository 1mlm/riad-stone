export type SortieRow = {
  id: number;
  entreeReference: string;
  designation: string;
  origine: string | null;
  dateEntree: Date;
  // metres
  longueur: number;
  largeur: number;
  // pieces taken by this specific sortie, not the entree's original total
  nombrePieces: number;
  dateSortie: Date;
  bonCommande: string | null;
};

export type AvailableEntree = {
  reference: string;
  designation: string;
  piecesRestantes: number;
};

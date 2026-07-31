export type SortieRow = {
  entreeReference: string;
  designation: string;
  origine: string | null;
  dateEntree: Date;
  // metres
  longueur: number;
  largeur: number;
  nombrePieces: number;
  dateSortie: Date;
  bonCommande: string | null;
};

export type AvailableEntree = {
  reference: string;
  designation: string;
};

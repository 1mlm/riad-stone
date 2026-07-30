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
  bonCommande: string;
};

export type AvailableEntree = {
  reference: string;
  designation: string;
};

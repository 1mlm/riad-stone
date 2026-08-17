export type SortieRow = {
  id: number;
  entreeReference: string;
  designation: string;
  origine: string | null;
  conteneur: string | null;
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
  date: Date;
  piecesRestantes: number;
  // the entree's original nombrePieces, ignoring sorties already taken from
  // it — piecesRestantes/piecesTotal is what the combobox shows
  piecesTotal: number;
};

export type EntreeRow = {
  reference: string;
  designation: string;
  date: Date;
  origine: string | null;
  conteneur: string | null;
  // metres
  longueur: number;
  largeur: number;
  nombrePieces: number;
};

// lowercases, strips accents and drops everything but letters/digits, so
// "Nb de Pièce", "NOMBRE DE PIECES" and "nbr piéce" all collapse to the same
// comparable string regardless of how a given spreadsheet spelled it
export function normalizeHeader(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

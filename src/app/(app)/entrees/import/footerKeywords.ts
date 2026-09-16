import { normalizeHeader } from "./normalize";

// a table's own summary row ("Nombre de Pièce ... Total m2 ...") sits right
// below its last data row with no blank line in between, so it can't be told
// apart from data by position alone — these are the labels that mark one
const FOOTER_KEYWORDS = ["total", "totaux", "totalgeneral", "grandtotal"];

export function looksLikeFooterRow(cellTexts: string[]): boolean {
  return cellTexts.some((text) => {
    const normalized = normalizeHeader(text);
    return normalized && FOOTER_KEYWORDS.some((kw) => normalized.includes(kw));
  });
}

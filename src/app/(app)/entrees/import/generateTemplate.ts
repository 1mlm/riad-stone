import ExcelJS from "exceljs";
import { ENTREE_FIELDS } from "../fields";

// one row of headers straight off ENTREE_FIELDS, the same source of truth
// the add/edit forms render from — the template can't drift from what the
// app actually expects, and the import parser reads any of these headers'
// real-world spelling variants anyway, so a user overwriting a header
// doesn't break re-importing their own template
const EXAMPLE_ROW: Record<string, string | number> = {
  designation: "Granite Blanc",
  reference: "TZ001",
  longueur: 300,
  largeur: 60,
  nombrePieces: 12,
  date: new Date().toLocaleDateString("fr-FR"),
  origine: "Espagne",
  conteneur: "CONT123456",
  commentaire: "",
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadImportTemplate() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Entrées");
  sheet.columns = ENTREE_FIELDS.map((field) => ({
    header:
      field.key === "longueur" || field.key === "largeur"
        ? `${field.label} (cm)`
        : field.label,
    key: field.key,
    width: 18,
  }));
  sheet.addRow(EXAMPLE_ROW);
  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    "modele_entrees.xlsx",
  );
}

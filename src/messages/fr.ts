import type { CustomTableLabels } from "@/components/table/labels";

// riad-stone's French copy for the otherwise English-by-default UI
// primitives (see CLAUDE.md: those components default to English so they
// port cleanly to other projects — this file is the one place this
// project's French strings live, passed in explicitly at each call site)
export const fr = {
  common: {
    cancel: "Annuler",
    pleaseWait: "Patientez…",
    locale: "fr-FR",
  },
  deleteRow: {
    confirmLabel: "Supprimer",
  },
  datePicker: {
    placeholder: "Maintenant",
  },
  searchBar: {
    resultLabelSingular: "résultat",
    resultLabelPlural: "résultats",
  },
  table: {
    selectAllRows: "Sélectionner toutes les lignes",
    selectRow: "Sélectionner la ligne",
    emptyTitle: "Rien à afficher",
    resetFilters: "Réinitialiser les filtres et le tri",
    resetFiltersShort: "Réinitialiser",
    deleteSelected: (count) =>
      `Supprimer ${count} élément${count > 1 ? "s" : ""}`,
    deleteSelectedShort: (count) => `Supprimer ${count}`,
    deleteSelectedTitle: (count) =>
      `Supprimer ${count} élément${count > 1 ? "s" : ""} ?`,
    deleteSelectedContent:
      "Ces lignes seront supprimées définitivement. Cette action est irréversible.",
    waiting: "Patientez…",
    pageOf: (current, total) => `Page ${current} sur ${total}`,
    go: "Aller",
    filter: "Filtrer",
    sort: "Trier",
    selectAll: "Tout sélectionner",
    noValue: "Aucune valeur",
    yes: "Oui",
    no: "Non",
    min: "Min",
    max: "Max",
    // NumberRangeFilterContent's "between min and max" reads "et" between
    // the two inputs, same word LengthRangeFilterContent already uses
    to: "et",
    between: "Entre",
    and: "et",
    search: "Rechercher...",
    searchTags: "Rechercher des tags...",
    count: "Nombre",
    ascending: "Croissant",
    descending: "Décroissant",
    cancel: "Annuler",
    lastHour: "Dernière heure",
    today: "Aujourd'hui",
    yesterday: "Hier",
    thisWeek: "Cette semaine",
    thisMonth: "Ce mois-ci",
    extractSelected: (count) =>
      `Extraire ${count} élément${count > 1 ? "s" : ""}`,
    extractSelectedShort: (count) => `Extraire ${count}`,
    extractDialogTitle: (count) =>
      `Extraire ${count} élément${count > 1 ? "s" : ""}`,
    extractDialogDescription:
      "Choisissez un format de fichier pour télécharger les lignes sélectionnées.",
    excelFormat: "Excel (.xlsx)",
    csvFormat: "CSV (.csv)",
    timestamp: "Horodatage : ",
  } satisfies CustomTableLabels,
};

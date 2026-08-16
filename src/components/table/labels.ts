// every user-facing string CustomTable and its satellites (column header
// filters/sort, row actions, export dialog) render, English by default so
// the table ports cleanly to other projects — a caller overrides only the
// keys it needs via the `labels` prop, the rest fall back to these
export type CustomTableLabels = {
  selectAllRows: string;
  selectRow: string;
  cancelSelection: string;
  rightClickHint: string;
  longPressHint: string;
  emptyTitle: string;
  resetFilters: string;
  resetFiltersShort: string;
  deleteSelected: (count: number) => string;
  deleteSelectedShort: (count: number) => string;
  deleteSelectedTitle: (count: number) => string;
  deleteSelectedContent: string;
  waiting: string;
  pageOf: (current: number, total: number) => string;
  go: string;
  filter: string;
  sort: string;
  selectAll: string;
  noValue: string;
  yes: string;
  no: string;
  min: string;
  max: string;
  to: string;
  between: string;
  and: string;
  search: string;
  searchTags: string;
  count: string;
  ascending: string;
  descending: string;
  cancel: string;
  lastHour: string;
  today: string;
  yesterday: string;
  thisWeek: string;
  thisMonth: string;
  extractSelected: (count: number) => string;
  extractSelectedShort: (count: number) => string;
  extractDialogTitle: (count: number) => string;
  extractDialogDescription: string;
  excelFormat: string;
  csvFormat: string;
  timestamp: string;
};

export const DEFAULT_TABLE_LABELS: CustomTableLabels = {
  selectAllRows: "Select all rows",
  selectRow: "Select row",
  cancelSelection: "Cancel selection",
  rightClickHint: "Right-click a row to open its actions",
  longPressHint: "Press and hold a row to open its actions",
  emptyTitle: "Nothing to show",
  resetFilters: "Reset filters and sort",
  resetFiltersShort: "Reset",
  deleteSelected: (count) => `Delete ${count} item${count > 1 ? "s" : ""}`,
  deleteSelectedShort: (count) => `Delete ${count}`,
  deleteSelectedTitle: (count) =>
    `Delete ${count} item${count > 1 ? "s" : ""}?`,
  deleteSelectedContent:
    "These rows will be permanently deleted. This action is irreversible.",
  waiting: "Please wait…",
  pageOf: (current, total) => `Page ${current} of ${total}`,
  go: "Go",
  filter: "Filter",
  sort: "Sort",
  selectAll: "Select all",
  noValue: "No value",
  yes: "Yes",
  no: "No",
  min: "Min",
  max: "Max",
  to: "to",
  between: "Between",
  and: "and",
  search: "Search...",
  searchTags: "Search tags...",
  count: "Count",
  ascending: "Ascending",
  descending: "Descending",
  cancel: "Cancel",
  lastHour: "Last hour",
  today: "Today",
  yesterday: "Yesterday",
  thisWeek: "This week",
  thisMonth: "This month",
  extractSelected: (count) => `Extract ${count} item${count > 1 ? "s" : ""}`,
  extractSelectedShort: (count) => `Extract ${count}`,
  extractDialogTitle: (count) => `Extract ${count} item${count > 1 ? "s" : ""}`,
  extractDialogDescription:
    "Choose a file format to download the selected rows.",
  excelFormat: "Excel (.xlsx)",
  csvFormat: "CSV (.csv)",
  timestamp: "Timestamp: ",
};

export const resolveTableLabels = (
  overrides?: Partial<CustomTableLabels>,
): CustomTableLabels => ({ ...DEFAULT_TABLE_LABELS, ...overrides });

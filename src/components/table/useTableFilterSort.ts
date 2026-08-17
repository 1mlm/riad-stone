import { parseAsString, useQueryState, useQueryStates } from "nuqs";
import { useMemo } from "react";
import type { CustomTableColumn } from "./CustomTable";
import {
  type ColumnFilterField,
  type CustomTableSort,
  columnMatchesFilter,
  compareColumnValues,
  getColumnFilterFields,
  getFilterKey,
  parseSort,
  serializeSort,
} from "./filtering";

// everything the global search box is allowed to match against for one row
function getSearchableStrings<T>(
  columns: CustomTableColumn<T>[],
  item: T,
): string[] {
  return columns.flatMap((column) => {
    if (column.type === "string") return [column.getString(item)];
    if (column.type === "copy")
      return column.searchable === false ? [] : [column.getString(item)];
    if (column.type === "enum") {
      const value = column.getValue(item);
      return value !== undefined
        ? [column.enumOptions[value]?.label ?? ""]
        : [];
    }
    if (column.type === "tags")
      return column.getTags(item).map((tag) => tag.label);
    return [];
  });
}

// owns the full search+filter+sort pipeline: URL-synced filter/sort state,
// the free-text search box (read here, written by the page's own SearchBar
// via the shared searchQueryKey), and the resulting visibleItems
export function useTableFilterSort<T>(
  items: T[],
  columns: CustomTableColumn<T>[],
  {
    filterable,
    sortable,
    searchQueryKey,
    sortQueryKey,
    defaultSort,
  }: {
    filterable: boolean;
    sortable: boolean;
    searchQueryKey: string;
    sortQueryKey: string;
    defaultSort?: { columnId: string; dir: "asc" | "desc" }[];
  },
) {
  const [search] = useQueryState(searchQueryKey, { defaultValue: "" });
  const [sortRaw, setSortRaw] = useQueryState(sortQueryKey, {
    defaultValue: "",
  });
  const sort = sortable ? parseSort(sortRaw) : null;

  const filterParsers = useMemo(
    () =>
      Object.fromEntries(
        filterable
          ? columns.flatMap((column) =>
              getColumnFilterFields(column).map((field) => [
                getFilterKey(column.id, field),
                parseAsString.withDefault(""),
              ]),
            )
          : [],
      ),
    [columns, filterable],
  );
  const [filterValues, setFilterValues] = useQueryStates(filterParsers);

  const getColumnField =
    (columnId: string) =>
    (field: ColumnFilterField): string =>
      filterValues[getFilterKey(columnId, field)] ?? "";
  const setColumnField = (
    columnId: string,
    field: ColumnFilterField,
    value: string,
  ) => setFilterValues({ [getFilterKey(columnId, field)]: value });

  const hasActiveFilterOrSort =
    Object.values(filterValues).some(Boolean) || sort !== null;
  const resetFilterAndSort = () => {
    setFilterValues(
      Object.fromEntries(Object.keys(filterValues).map((key) => [key, ""])),
    );
    setSortRaw("");
  };

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (
        query &&
        !getSearchableStrings(columns, item).some((s) =>
          s.toLowerCase().includes(query),
        )
      )
        return false;
      if (!filterable) return true;
      return columns.every((column) =>
        columnMatchesFilter(
          column,
          item,
          (field) => filterValues[getFilterKey(column.id, field)] ?? "",
        ),
      );
    });
    if (sort) {
      const sortColumn = columns.find((column) => column.id === sort.columnId);
      if (!sortColumn) return filtered;
      const sorted = [...filtered].sort((a, b) =>
        compareColumnValues(sortColumn, a, b),
      );
      return sort.dir === "desc" ? sorted.reverse() : sorted;
    }
    if (!defaultSort || defaultSort.length === 0) return filtered;
    return [...filtered].sort((a, b) => {
      for (const key of defaultSort) {
        const sortColumn = columns.find((column) => column.id === key.columnId);
        if (!sortColumn) continue;
        const cmp = compareColumnValues(sortColumn, a, b);
        if (cmp !== 0) return key.dir === "desc" ? -cmp : cmp;
      }
      return 0;
    });
  }, [items, columns, search, sort, defaultSort, filterValues, filterable]);

  return {
    visibleItems,
    search,
    sort,
    // raw string form, safe to use as an effect dependency (parsed `sort` is
    // a fresh object every render even when unchanged, which would falsely
    // retrigger anything keyed on it)
    sortRaw,
    setSort: (next: CustomTableSort) => setSortRaw(serializeSort(next)),
    filterValues,
    getColumnField,
    setColumnField,
    hasActiveFilterOrSort,
    resetFilterAndSort,
  };
}

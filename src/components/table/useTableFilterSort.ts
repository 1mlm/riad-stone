import { parseAsString, useQueryState, useQueryStates } from "nuqs";
import { useMemo, useState } from "react";
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
    getItemId,
    pinnedItemIds,
    syncToUrl,
  }: {
    filterable: boolean;
    sortable: boolean;
    searchQueryKey: string;
    sortQueryKey: string;
    defaultSort?: { columnId: string; dir: "asc" | "desc" }[];
    getItemId: (item: T) => string;
    // kept in front of the sorted/filtered list, in this order, regardless
    // of the active sort — e.g. rows just created this session
    pinnedItemIds?: string[];
    // false for a table embedded in a dialog: its search/filter/sort are
    // session-local, not something that belongs in the page's shareable URL
    // or should survive the dialog closing. Both branches are always called
    // (hooks can't be conditional) and the unused one just sits idle
    syncToUrl: boolean;
  },
) {
  const [urlSearch] = useQueryState(searchQueryKey, { defaultValue: "" });
  const [localSearch, setLocalSearch] = useState("");
  const search = syncToUrl ? urlSearch : localSearch;

  const [urlSortRaw, setUrlSortRaw] = useQueryState(sortQueryKey, {
    defaultValue: "",
  });
  const [localSortRaw, setLocalSortRaw] = useState("");
  const sortRaw = syncToUrl ? urlSortRaw : localSortRaw;
  const setSortRaw = syncToUrl ? setUrlSortRaw : setLocalSortRaw;
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
  const [urlFilterValues, setUrlFilterValues] = useQueryStates(filterParsers);
  const [localFilterValues, setLocalFilterValues] = useState<
    Record<string, string>
  >({});
  const filterValues = syncToUrl ? urlFilterValues : localFilterValues;
  const setFilterValues = syncToUrl
    ? setUrlFilterValues
    : (patch: Record<string, string>) =>
        setLocalFilterValues((prev) => ({ ...prev, ...patch }));

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
    const sorted = (() => {
      if (sort) {
        const sortColumn = columns.find(
          (column) => column.id === sort.columnId,
        );
        if (!sortColumn) return filtered;
        const bySortColumn = [...filtered].sort((a, b) =>
          compareColumnValues(sortColumn, a, b),
        );
        return sort.dir === "desc" ? bySortColumn.reverse() : bySortColumn;
      }
      if (!defaultSort || defaultSort.length === 0) return filtered;
      return [...filtered].sort((a, b) => {
        for (const key of defaultSort) {
          const sortColumn = columns.find(
            (column) => column.id === key.columnId,
          );
          if (!sortColumn) continue;
          const cmp = compareColumnValues(sortColumn, a, b);
          if (cmp !== 0) return key.dir === "desc" ? -cmp : cmp;
        }
        return 0;
      });
    })();

    if (!pinnedItemIds || pinnedItemIds.length === 0) return sorted;
    const pinnedIdSet = new Set(pinnedItemIds);
    const byId = new Map(sorted.map((item) => [getItemId(item), item]));
    const pinned = pinnedItemIds
      .map((id) => byId.get(id))
      .filter((item): item is T => item !== undefined);
    const rest = sorted.filter((item) => !pinnedIdSet.has(getItemId(item)));
    return [...pinned, ...rest];
  }, [
    items,
    columns,
    search,
    sort,
    defaultSort,
    filterValues,
    filterable,
    pinnedItemIds,
    getItemId,
  ]);

  return {
    visibleItems,
    search,
    // only meaningful when syncToUrl is false — otherwise the page's own
    // SearchBar owns writes to the shared URL key instead
    setSearch: setLocalSearch,
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

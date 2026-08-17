import { useMemo } from "react";
import type { CustomTableColumn } from "./CustomTable";

// consecutive-equal runs per mergeAdjacent column, computed over the
// rendered page only — a run split across a page boundary renders as two
// merged cells, which is correct given each page is its own <table>
export function useMergeRuns<T>(
  columns: CustomTableColumn<T>[],
  paginatedItems: T[],
) {
  return useMemo(() => {
    const runs = new Map<string, { start: boolean; length: number }[]>();
    for (const column of columns) {
      if (column.type !== "string" || !column.mergeAdjacent) continue;
      const getKey = column.getMergeKey ?? column.getString;
      const arr: { start: boolean; length: number }[] = [];
      for (let i = 0; i < paginatedItems.length; i++) {
        if (
          i > 0 &&
          getKey(paginatedItems[i - 1]) === getKey(paginatedItems[i])
        ) {
          arr.push({ start: false, length: 0 });
          continue;
        }
        let length = 1;
        while (
          i + length < paginatedItems.length &&
          getKey(paginatedItems[i + length]) === getKey(paginatedItems[i])
        )
          length++;
        arr.push({ start: true, length });
      }
      runs.set(column.id, arr);
    }
    return runs;
  }, [columns, paginatedItems]);
}

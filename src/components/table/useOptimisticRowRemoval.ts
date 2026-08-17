"use client";

import { useCallback, useMemo, useState } from "react";

// hides a row the moment its delete is confirmed, instead of waiting on the
// server action's revalidatePath round-trip — rolled back on error. Shared
// by every deletable table: single-row via DeleteRowMenuItem's
// onOptimisticRemove/onRevert, bulk via CustomTable's onDeleteSelected
export function useOptimisticRowRemoval<T, K>(
  items: T[],
  getKey: (item: T) => K,
) {
  const [pendingRemoved, setPendingRemoved] = useState<Set<K>>(new Set());

  const visibleItems = useMemo(
    () => items.filter((item) => !pendingRemoved.has(getKey(item))),
    [items, pendingRemoved, getKey],
  );

  // stable identities (pure functional setState, no closed-over state) so
  // callers can safely list these in a useMemo/useCallback deps array
  // without defeating the memoization
  const markRemoved = useCallback(
    (key: K) => setPendingRemoved((prev) => new Set(prev).add(key)),
    [],
  );

  const unmarkRemoved = useCallback(
    (key: K) =>
      setPendingRemoved((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      }),
    [],
  );

  // runs deleteAction per row in parallel, keeps only the failures visible
  // again — matches CustomTable's onDeleteSelected contract
  const deleteSelected = useCallback(
    async (
      rows: T[],
      deleteAction: (row: T) => Promise<{ error: string | null }>,
    ) => {
      const keys = rows.map(getKey);
      setPendingRemoved((prev) => new Set([...prev, ...keys]));

      const results = await Promise.all(rows.map(deleteAction));
      const failedKeys = rows.filter((_, i) => results[i].error).map(getKey);
      if (failedKeys.length > 0)
        setPendingRemoved((prev) => {
          const next = new Set(prev);
          for (const key of failedKeys) next.delete(key);
          return next;
        });

      return { error: results.find((result) => result.error)?.error ?? null };
    },
    [getKey],
  );

  return { visibleItems, markRemoved, unmarkRemoved, deleteSelected };
}

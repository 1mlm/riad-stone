import { parseAsInteger, useQueryState } from "nuqs";
import { useEffect, useMemo } from "react";

const PAGE_SIZE = 25;

// URL-synced page number plus the current page's slice of visibleItems.
// Resets to page 1 whenever any value in resetDeps changes (search, filter,
// or sort) — a filter narrowing the results shouldn't leave the user
// stranded on a now-empty page 4
export function useTablePagination<T>(
  visibleItems: T[],
  {
    paginate,
    pageQueryKey,
    resetDeps,
  }: {
    paginate: boolean;
    pageQueryKey: string;
    resetDeps: readonly unknown[];
  },
) {
  const [page, setPage] = useQueryState(
    pageQueryKey,
    parseAsInteger.withDefault(1),
  );
  const pageCount = paginate
    ? Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE))
    : 1;
  const currentPage = Math.min(Math.max(page, 1), pageCount);

  // stable reference across renders — an unmemoized .slice() would return a
  // new array every render, and effects keyed on it (scroll-fade) would
  // re-fire every render and loop forever
  const paginatedItems = useMemo(
    () =>
      paginate
        ? visibleItems.slice(
            (currentPage - 1) * PAGE_SIZE,
            currentPage * PAGE_SIZE,
          )
        : visibleItems,
    [paginate, visibleItems, currentPage],
  );

  useEffect(() => {
    setPage(1);
  }, [...resetDeps, setPage]);

  return { currentPage, setPage, pageCount, paginatedItems };
}

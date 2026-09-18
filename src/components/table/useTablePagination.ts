import { parseAsInteger, useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 100;

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
    syncToUrl,
  }: {
    paginate: boolean;
    pageQueryKey: string;
    resetDeps: readonly unknown[];
    syncToUrl: boolean;
  },
) {
  const [urlPage, setUrlPage] = useQueryState(
    pageQueryKey,
    parseAsInteger.withDefault(1),
  );
  const [localPage, setLocalPage] = useState(1);
  const page = syncToUrl ? urlPage : localPage;
  const setPage = syncToUrl ? setUrlPage : setLocalPage;
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

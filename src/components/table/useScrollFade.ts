import { useEffect, useRef, useState } from "react";
import { useHorizontalScrollFade } from "@/components/useHorizontalScrollFade";
import type { CustomTableColumn } from "./CustomTable";

// the table's flavour of the shared scroll-fade: same ramp and mask as the
// multi-fiche carousel, plus the sticky checkbox column's width. That column
// never scrolls out of view, so the fade has to start right after it instead
// of washing it out
export function useScrollFade<T>(
  columns: CustomTableColumn<T>[],
  paginatedItems: T[],
) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const checkboxColumnRef = useRef<HTMLTableCellElement>(null);
  const [checkboxColumnWidth, setCheckboxColumnWidth] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: only used to trigger remeasuring after content changes width, not read
  useEffect(() => {
    setCheckboxColumnWidth(checkboxColumnRef.current?.offsetWidth ?? 0);
  }, [columns, paginatedItems]);

  const maskImage = useHorizontalScrollFade(scrollContainerRef, {
    stickyRegionWidth: checkboxColumnWidth,
    deps: [columns, paginatedItems],
  });

  return {
    scrollContainerRef,
    checkboxColumnRef,
    checkboxColumnWidth,
    maskImage,
  };
}

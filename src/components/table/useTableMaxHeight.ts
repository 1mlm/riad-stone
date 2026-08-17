import { type RefObject, useEffect, useState } from "react";

const BOTTOM_CUSHION = 20;

// caps the table's own scroll region at exactly the remaining space below it
// in the viewport, so its own scrollbar's bottom edge lands on the visible
// screen edge instead of some shorter, easy-to-miss box — the header can
// then rely on being sticky within this self-contained scroll region
// instead of needing to coordinate with whatever sits above the table on
// the page (search bar, toolbar, ...). Measured via getBoundingClientRect
// rather than a specific scrolling ancestor's clientHeight because which
// element actually scrolls differs: desktop scrolls <main> internally,
// mobile scrolls the whole page instead
export function useTableMaxHeight(scrollContainerRef: RefObject<HTMLDivElement | null>) {
  const [maxHeight, setMaxHeight] = useState<number>();

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const updateMaxHeight = () => {
      setMaxHeight(window.innerHeight - el.getBoundingClientRect().top - BOTTOM_CUSHION);
    };

    updateMaxHeight();
    window.addEventListener("resize", updateMaxHeight);
    return () => window.removeEventListener("resize", updateMaxHeight);
  }, [scrollContainerRef]);

  return maxHeight;
}

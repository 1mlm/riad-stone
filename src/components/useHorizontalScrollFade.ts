import { type RefObject, useEffect, useState } from "react";

const SCROLL_FADE_SIZE = 32;

const clampToUnit = (value: number) => Math.min(1, Math.max(0, value));

// alpha-masks the scroll container itself (not an overlay) so the fade blends
// correctly over whatever sits behind it. leftProgress/rightProgress (0-1) ramp
// up over the first SCROLL_FADE_SIZE px of scroll instead of snapping on at
// 1px, so a tiny scroll shows a faint fade and a bigger one shows the full fade
function getScrollFadeMask(
  leftProgress: number,
  rightProgress: number,
  stickyRegionWidth: number,
) {
  const leftAlpha = 1 - leftProgress;
  const rightAlpha = 1 - rightProgress;
  const left = `black ${stickyRegionWidth}px, rgba(0,0,0,${leftAlpha}) ${stickyRegionWidth}px, black ${stickyRegionWidth + SCROLL_FADE_SIZE}px`;
  const right = `black calc(100% - ${SCROLL_FADE_SIZE}px), rgba(0,0,0,${rightAlpha})`;
  return `linear-gradient(to right, ${left}, ${right})`;
}

// tracks how far a horizontal scroll container sits from each end and turns
// that into a CSS mask-image. Shared by the tables and the multi-fiche
// carousel so both fade identically — stickyRegionWidth is for a pinned left
// column the fade has to start after (0 when nothing is pinned), and deps
// retrigger measurement when the caller's content changes width without the
// container itself resizing
export function useHorizontalScrollFade(
  containerRef: RefObject<HTMLElement | null>,
  {
    stickyRegionWidth = 0,
    deps = [],
  }: { stickyRegionWidth?: number; deps?: unknown[] } = {},
) {
  const [scrollFade, setScrollFade] = useState({ left: 0, right: 0 });

  // deps are only here to retrigger measuring after the caller's content
  // changes width, their values are never read
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScrollFade = () => {
      const remainingRight =
        container.scrollWidth - container.clientWidth - container.scrollLeft;
      const left = clampToUnit(container.scrollLeft / SCROLL_FADE_SIZE);
      const right = clampToUnit(remainingRight / SCROLL_FADE_SIZE);
      setScrollFade((prev) =>
        prev.left === left && prev.right === right ? prev : { left, right },
      );
    };

    updateScrollFade();
    container.addEventListener("scroll", updateScrollFade);

    // ResizeObserver isn't available on older browsers (e.g. Firefox < 69) —
    // falling back to a window resize listener still catches viewport changes,
    // just not container-only resizes, rather than crashing the effect
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateScrollFade);
      return () => {
        container.removeEventListener("scroll", updateScrollFade);
        window.removeEventListener("resize", updateScrollFade);
      };
    }

    const resizeObserver = new ResizeObserver(updateScrollFade);
    resizeObserver.observe(container);
    return () => {
      container.removeEventListener("scroll", updateScrollFade);
      resizeObserver.disconnect();
    };
  }, [containerRef, ...deps]);

  return getScrollFadeMask(
    scrollFade.left,
    scrollFade.right,
    stickyRegionWidth,
  );
}

const STORAGE_KEY = "row-menu-open-count";
const HIDE_HINT_AFTER = 3;

// once someone's successfully opened a row menu a few times, the hint
// text ("right-click/long-press to open") is just noise — they know
export function getRowMenuOpenCount(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(STORAGE_KEY) ?? 0);
}

export function recordRowMenuOpen(): number {
  const next = getRowMenuOpenCount() + 1;
  localStorage.setItem(STORAGE_KEY, String(next));
  return next;
}

export function shouldShowRowMenuHint(openCount: number): boolean {
  return openCount < HIDE_HINT_AFTER;
}

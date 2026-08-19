import { useEffect, useRef, useState } from "react";

// tracks which ids appeared in `items` that weren't there on the previous
// render — used to pin/glow rows just created this session. Purely
// client-side, ephemeral state: a page refresh remounts the component, the
// ref starts empty again, and the table falls back to its normal sort
export function useJustCreatedIds<T>(
  items: T[],
  getItemId: (item: T) => string,
): string[] {
  const previousIdsRef = useRef<Set<string> | null>(null);
  const [justCreatedIds, setJustCreatedIds] = useState<string[]>([]);

  useEffect(() => {
    const currentIds = items.map(getItemId);
    const previousIds = previousIdsRef.current;
    previousIdsRef.current = new Set(currentIds);
    if (!previousIds) return;

    const newlyAdded = currentIds.filter((id) => !previousIds.has(id));
    if (newlyAdded.length > 0)
      setJustCreatedIds((prev) => [...newlyAdded, ...prev]);
  }, [items, getItemId]);

  return justCreatedIds;
}

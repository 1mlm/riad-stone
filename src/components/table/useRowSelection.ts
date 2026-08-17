import { useEffect, useState } from "react";
import { haptic } from "@/utils/haptics";
import { getTriState } from "./filtering";

// row-selection state: which ids are checked, whether checkboxes are shown
// at all (selectionMode — off until the user picks "Select" from a row's
// menu, on so they don't have to open that menu per row), and the derived
// counts/booleans every selection UI needs
export function useRowSelection<T>(
  items: T[],
  visibleItems: T[],
  getItemId: (item: T) => string,
  selectable: boolean,
) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  useEffect(() => {
    if (selectedIds.size === 0) setSelectionMode(false);
  }, [selectedIds]);

  const toggleRow = (id: string) => {
    haptic("selection");
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // compared against visible rows only — selectedIds can hold ids hidden by
  // the current filter, which would otherwise make this false (and the
  // header checkbox look unchecked) even when every visible row is selected
  const visibleSelectedCount = visibleItems.filter((item) =>
    selectedIds.has(getItemId(item)),
  ).length;
  const allSelected =
    visibleItems.length > 0 && visibleSelectedCount === visibleItems.length;
  const toggleAll = () => {
    haptic("selection");
    const next = new Set(selectedIds);
    for (const item of visibleItems) {
      if (allSelected) next.delete(getItemId(item));
      else next.add(getItemId(item));
    }
    setSelectedIds(next);
  };

  const clearSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const selectedItems = items.filter((item) =>
    selectedIds.has(getItemId(item)),
  );
  const hasSelection = selectable && selectedIds.size > 0;

  return {
    selectionMode,
    setSelectionMode,
    toggleRow,
    toggleAll,
    triState: getTriState(visibleSelectedCount, visibleItems.length),
    selectedItems,
    isSelected: (id: string) => selectedIds.has(id),
    hasSelection,
    clearSelection,
  };
}

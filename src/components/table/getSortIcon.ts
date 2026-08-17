import { ICONS } from "@/utils/icon";

// numeric columns sort with a 1-9/9-1 icon, everything else with an A-Z/Z-A
// icon — both pairs come from the same "Sorting" icon family so they read as
// one consistent visual language instead of mixing arrow and sorting glyphs
export const getSortIcon = (dir: "asc" | "desc", numeric: boolean) =>
  dir === "asc"
    ? numeric
      ? ICONS.increasingNumber
      : ICONS.increasingText
    : numeric
      ? ICONS.decreasingNumber
      : ICONS.decreasingText;

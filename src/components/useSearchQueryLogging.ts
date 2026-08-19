"use client";

import { usePathname } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useRef } from "react";
import { logSearchQuery } from "@/app/(app)/actions";

const LOG_DEBOUNCE_MS = 1500;

// logs a search once the user pauses typing, not per keystroke — observes
// the same URL-synced query key SearchBar/CustomTable already own, rather
// than owning the search state itself
export function useSearchQueryLogging(queryKey: string) {
  const [search] = useQueryState(queryKey, { defaultValue: "" });
  const pathname = usePathname();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    const query = search.trim();
    if (!query) return;
    timeoutRef.current = setTimeout(() => {
      logSearchQuery(query, pathname);
    }, LOG_DEBOUNCE_MS);
    return () => clearTimeout(timeoutRef.current);
  }, [search, pathname]);
}

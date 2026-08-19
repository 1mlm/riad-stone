"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { logPageVisit } from "@/app/(app)/actions";

// fires once per real navigation (usePathname ignores query-string-only
// changes, so search/filter/pagination clicks don't trigger this) — not in
// middleware, which would also catch <Link> hover-prefetches and RSC
// payload requests, and not from a server component, which would re-log on
// every revalidation after an unrelated server action
export function PageVisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    logPageVisit(pathname);
  }, [pathname]);

  return null;
}

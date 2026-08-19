import { createSerializer, parseAsString } from "nuqs";

// builds an absolute link that pre-fills a page's search box with one
// specific value — e.g. sharing a reference so whoever opens the link lands
// straight on that row instead of hunting for it
export function buildShareLink(
  path: string,
  searchQueryKey: string,
  value: string,
): string {
  const serialize = createSerializer({ [searchQueryKey]: parseAsString });
  // called from a client component's render, which Next also runs during
  // SSR (no window there) — the browser re-renders with the real origin
  // right after hydration, well before a click is possible
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}${serialize(path, { [searchQueryKey]: value })}`;
}

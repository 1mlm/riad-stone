"use client";

import { Search02Icon } from "@hugeicons/core-free-icons";
import { useQueryState } from "nuqs";
import type { HugeIcon } from "@/components/Icon";
import { Icon } from "@/components/Icon";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/shadcn/ui/input-group";
import { cn } from "@/shadcn/utils";

export function SearchBar({
  placeholder = "Search...",
  icon = Search02Icon,
  // pass a matching searchQueryKey to CustomTable when overriding this
  queryKey = "q",
  resultCount,
  resultLabelSingular = "result",
  resultLabelPlural = "results",
  className,
}: {
  placeholder?: string;
  icon?: HugeIcon;
  queryKey?: string;
  // shown right-aligned inside the bar, e.g. "12 results"
  resultCount?: number;
  resultLabelSingular?: string;
  resultLabelPlural?: string;
  className?: string;
}) {
  const [search, setSearch] = useQueryState(queryKey, { defaultValue: "" });

  return (
    // sits directly in a page's p-5 gap off the main content card's own
    // rounded-[3rem] corner — rounded-(--radius-concentric) keeps its
    // corner sharing that same center point instead of an arbitrary radius
    <InputGroup className={cn("rounded-(--radius-concentric)!", className)}>
      <InputGroupAddon>
        <Icon {...{ icon }} />
      </InputGroupAddon>
      <InputGroupInput
        {...{ placeholder }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        // flex-1 alone won't shrink below the placeholder's own rendered
        // width (flex items default to min-width: auto), which pushes the
        // result count out instead of ellipsizing — min-w-0 lets it actually
        // shrink, truncate does the ellipsizing
        className="min-w-0 truncate"
      />
      {resultCount !== undefined && (
        <InputGroupAddon align="inline-end" className="shrink-0">
          <InputGroupText>
            {resultCount}{" "}
            {resultCount === 1 ? resultLabelSingular : resultLabelPlural}
          </InputGroupText>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}

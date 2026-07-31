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

export function SearchBar({
  placeholder = "Rechercher...",
  icon = Search02Icon,
  // pass a matching searchQueryKey to CustomTable when overriding this
  queryKey = "q",
  resultCount,
  className,
}: {
  placeholder?: string;
  icon?: HugeIcon;
  queryKey?: string;
  // shown right-aligned inside the bar, e.g. "12 résultats"
  resultCount?: number;
  className?: string;
}) {
  const [search, setSearch] = useQueryState(queryKey, { defaultValue: "" });

  return (
    <InputGroup {...{ className }}>
      <InputGroupAddon>
        <Icon {...{ icon }} />
      </InputGroupAddon>
      <InputGroupInput
        {...{ placeholder }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {resultCount !== undefined && (
        <InputGroupAddon align="inline-end">
          <InputGroupText>
            {resultCount} {resultCount === 1 ? "résultat" : "résultats"}
          </InputGroupText>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}

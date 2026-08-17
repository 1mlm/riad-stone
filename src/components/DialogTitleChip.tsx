import type { ReactNode } from "react";
import { type HugeIcon, Icon } from "@/components/Icon";

// the noun a dialog title is about (e.g. "entrée", "sortie") gets its own
// little icon chip instead of sitting in with the rest of the sentence as
// plain text — a bit of visual flair, not just "Ajouter une entrée"
export function DialogTitleChip({
  icon,
  children,
}: {
  icon: HugeIcon;
  children: ReactNode;
}) {
  return (
    <span className="mx-1 inline-flex -rotate-1 items-center gap-1 corner-squircle rounded-md bg-muted px-2 py-0.5 align-middle">
      <Icon icon={icon} />
      {children}
    </span>
  );
}

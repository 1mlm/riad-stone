"use client";

import { Download01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import type { CustomTableColumn } from "./CustomTable";
import { ExtractDialog } from "./ExtractDialog";
import type { CustomTableLabels } from "./labels";

export function ExtractButton<T>({
  selectedItems,
  columns,
  filePrefix,
  labels,
}: {
  selectedItems: T[];
  columns: CustomTableColumn<T>[];
  filePrefix: string;
  labels: CustomTableLabels;
}) {
  const [open, setOpen] = useState(false);

  if (selectedItems.length === 0) return null;

  return (
    <>
      <Button
        variant="outline"
        className="shadow-lg"
        onClick={() => setOpen(true)}
      >
        <Icon icon={Download01Icon} />
        <span className="hidden sm:inline">
          {labels.extractSelected(selectedItems.length)}
        </span>
        <span className="sm:hidden">
          {labels.extractSelectedShort(selectedItems.length)}
        </span>
      </Button>
      <ExtractDialog
        {...{ open, columns, filePrefix, labels }}
        onOpenChange={setOpen}
        items={selectedItems}
      />
    </>
  );
}

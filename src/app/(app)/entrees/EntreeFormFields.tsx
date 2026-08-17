"use client";

import { type ReactNode, useState } from "react";
import { Icon } from "@/components/Icon";
import { Separator } from "@/shadcn/ui/separator";
import { cn } from "@/shadcn/utils";
import { ICONS } from "@/utils/icon";
import { EntreeLabelledField } from "./EntreeLabelledField";
import type { FieldContext } from "./entreeFieldContext";
import { ENTREE_FIELDS, type EntreeField } from "./fields";
import { groupFields } from "./groupFields";

export function EntreeFormFields({
  mode,
  entree,
  namePrefix,
  excludeKeys,
  suggestions,
}: FieldContext & { excludeKeys?: EntreeField["key"][] }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const context = { mode, entree, namePrefix, suggestions };
  const fields: EntreeField[] = ENTREE_FIELDS.filter(
    (field) => !excludeKeys?.includes(field.key),
  );
  const requiredFields = fields.filter((field) => field.required);
  const visibleOptionalFields = fields.filter(
    (field) => !field.required && !field.collapsedByDefault,
  );
  const collapsedFields = fields.filter(
    (field) => !field.required && field.collapsedByDefault,
  );

  const renderItem = (item: EntreeField | EntreeField[]): ReactNode =>
    Array.isArray(item) ? (
      <div
        key={item.map((f) => f.key).join("-")}
        className="grid grid-cols-2 gap-3"
      >
        {item.map((field) => (
          <EntreeLabelledField key={field.key} {...{ field, context }} />
        ))}
      </div>
    ) : (
      <EntreeLabelledField key={item.key} field={item} {...{ context }} />
    );

  return (
    <>
      {groupFields(requiredFields).map(renderItem)}
      {groupFields(visibleOptionalFields).map(renderItem)}
      {collapsedFields.length > 0 && (
        <>
          <Separator />
          <button
            type="button"
            onClick={() => setDetailsOpen((open) => !open)}
            className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Détails supplémentaires
            <Icon
              icon={ICONS.chevronDown}
              className={cn(
                "size-3.5 transition-transform",
                detailsOpen && "rotate-180",
              )}
            />
          </button>
          {detailsOpen && groupFields(collapsedFields).map(renderItem)}
        </>
      )}
    </>
  );
}

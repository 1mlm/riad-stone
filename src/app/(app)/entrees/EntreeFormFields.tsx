"use client";

import type { ReactNode } from "react";
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
  const context = { mode, entree, namePrefix, suggestions };
  const fields: EntreeField[] = ENTREE_FIELDS.filter(
    (field) => !excludeKeys?.includes(field.key),
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

  return groupFields(fields).map(renderItem);
}

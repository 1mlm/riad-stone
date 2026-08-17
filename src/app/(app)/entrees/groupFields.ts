import type { EntreeField } from "./fields";

// consecutive fields sharing a `group` render side by side in one grid row
export function groupFields(
  fields: readonly EntreeField[],
): (EntreeField | EntreeField[])[] {
  const result: (EntreeField | EntreeField[])[] = [];
  for (const field of fields) {
    const last = result[result.length - 1];
    const lastGroup = Array.isArray(last) ? last[0]?.group : undefined;
    if (field.group && lastGroup === field.group)
      (last as EntreeField[]).push(field);
    else result.push(field.group ? [field] : field);
  }
  return result;
}

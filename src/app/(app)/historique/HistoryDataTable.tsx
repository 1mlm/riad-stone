import { Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";
import type { HistorySnapshot } from "@/utils/historySnapshot";
import { ICONS } from "@/utils/icon";
import { HistoryFieldValue } from "./HistoryFieldValue";
import { FIELD_META, getDisplayFields } from "./historyFieldMeta";

// one field per column (icon + label header), one row per snapshot — before
// & after for an update, just current otherwise — instead of the old
// per-field "label, previous, next" layout, so every popover in the app
// reads the same way regardless of how many fields it's showing
export function HistoryDataTable({
  eventId,
  current,
  before,
}: {
  eventId: number;
  current: HistorySnapshot;
  before?: HistorySnapshot;
}) {
  const fields = getDisplayFields(current, before);
  if (fields.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="text-xs">
        <thead>
          <tr>
            {fields.map((field) => {
              const meta = FIELD_META[field];
              return (
                <th
                  key={field}
                  className="border-b border-border/50 px-3 py-1.5 text-left font-medium whitespace-nowrap text-muted-foreground"
                >
                  <span className="flex items-center gap-1.5">
                    <Icon icon={meta?.icon ?? ICONS.details} />
                    {meta?.label ?? field}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {before && (
            <tr>
              {fields.map((field) => (
                <td
                  key={field}
                  className={cn(
                    "px-3 py-1.5 text-destructive line-through decoration-dashed",
                    field === "bonCommande" && "font-mono",
                  )}
                >
                  <HistoryFieldValue
                    {...{ field, eventId }}
                    value={before[field]}
                  />
                </td>
              ))}
            </tr>
          )}
          <tr>
            {fields.map((field) => (
              <td
                key={field}
                className={cn(
                  "px-3 py-1.5",
                  field === "bonCommande" && "font-mono",
                  before && "font-bold text-green-600",
                )}
              >
                <HistoryFieldValue
                  {...{ field, eventId }}
                  value={current[field]}
                />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

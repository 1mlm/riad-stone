import { Skeleton } from "@/shadcn/ui/skeleton";
import { TableCell, TableRow } from "@/shadcn/ui/table";
import { cn } from "@/shadcn/utils";
import type { CustomTableColumn } from "./CustomTable";

const SKELETON_ROW_KEYS = Array.from({ length: 8 }, (_, i) => `skeleton-${i}`);

export function CustomTableSkeletonRows<T>({
  bodyColumns,
  hasCheckboxColumn,
}: {
  bodyColumns: Exclude<CustomTableColumn<T>, { type: "buttons" }>[];
  hasCheckboxColumn: boolean;
}) {
  return (
    <>
      {SKELETON_ROW_KEYS.map((key, index) => {
        const skeletonBg =
          index % 2 === 1
            ? "bg-[color-mix(in_oklch,var(--background),var(--foreground)_5%)]"
            : "bg-background";
        const isLastSkeletonRow = index === SKELETON_ROW_KEYS.length - 1;
        return (
          <TableRow
            key={key}
            className={cn(index % 2 === 1 && "bg-foreground/5")}
          >
            {hasCheckboxColumn && (
              <TableCell
                className={cn(
                  "sticky left-0 z-10 border-r border-border/50",
                  skeletonBg,
                  isLastSkeletonRow && "rounded-bl-(--radius-concentric)",
                )}
              >
                <div className="flex justify-center pr-2!">
                  <Skeleton className="size-7" />
                </div>
              </TableCell>
            )}
            {bodyColumns.map((column, columnIndex) => (
              <TableCell
                key={column.id}
                className={cn(
                  "border-r border-border/50 last:border-r-0",
                  isLastSkeletonRow &&
                    columnIndex === 0 &&
                    !hasCheckboxColumn &&
                    "rounded-bl-(--radius-concentric)",
                  isLastSkeletonRow &&
                    columnIndex === bodyColumns.length - 1 &&
                    "rounded-br-(--radius-concentric)",
                )}
              >
                <Skeleton className="h-4 w-full min-w-12" />
              </TableCell>
            ))}
          </TableRow>
        );
      })}
    </>
  );
}

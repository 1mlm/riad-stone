import { cn } from "@/shadcn/utils";

// keeps the start and a fixed-length tail visible, ellipsizing only the middle
export function MiddleTruncatedText({
  value,
  monospace,
}: {
  value: string;
  monospace?: boolean;
}) {
  const tailLength = Math.min(8, Math.floor(value.length / 3));
  const head = value.slice(0, value.length - tailLength);
  const tail = value.slice(value.length - tailLength);

  return (
    <span
      className={cn(
        "flex max-w-64 items-center",
        monospace && "font-mono text-xs",
      )}
    >
      <span className="overflow-hidden text-ellipsis whitespace-pre">
        {head}
      </span>
      <span className="shrink-0 whitespace-pre">{tail}</span>
    </span>
  );
}

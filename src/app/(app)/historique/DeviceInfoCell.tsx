import type { DeviceInfo } from "@/utils/deviceInfo";

// best-effort: renders whatever shows up. Legacy rows stored a plain string,
// current ones a DeviceInfo blob — every field in that blob is itself
// optional since browser/os/device/geo only fill in when detectable
export function DeviceInfoCell({ value }: { value: unknown }) {
  if (typeof value === "string") return <>{value}</>;
  if (!value || typeof value !== "object") return <>-</>;

  const info = value as Partial<DeviceInfo>;
  const summary = [
    info.browser?.name &&
      `${info.browser.name} ${info.browser.version ?? ""}`.trim(),
    info.os?.name && `${info.os.name} ${info.os.version ?? ""}`.trim(),
    info.device?.type &&
      (info.device.model
        ? `${info.device.model} (${info.device.type})`
        : info.device.type),
  ].filter(Boolean);
  const location = [info.geo?.city, info.geo?.country].filter(Boolean);

  return (
    <div className="flex flex-col gap-0.5 py-1">
      {summary.length > 0 && <span>{summary.join(" · ")}</span>}
      {(location.length > 0 || info.geo?.flag) && (
        <span className="text-muted-foreground">
          {info.geo?.flag} {location.join(", ")}
        </span>
      )}
      {info.ip && (
        <span className="font-mono text-muted-foreground">{info.ip}</span>
      )}
      {info.userAgent && (
        <span
          className="block max-w-64 truncate text-muted-foreground"
          title={info.userAgent}
        >
          {info.userAgent}
        </span>
      )}
    </div>
  );
}

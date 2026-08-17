import { DeviceInfoCell } from "./DeviceInfoCell";
import { formatFieldValue } from "./historyFieldMeta";
import { RevealSecretValue } from "./RevealSecretValue";

export function HistoryFieldValue({
  field,
  value,
  eventId,
}: {
  field: string;
  value: unknown;
  eventId: number;
}) {
  if (field === "code" && value) return <RevealSecretValue {...{ eventId }} />;
  if (field === "userAgent") return <DeviceInfoCell {...{ value }} />;
  return <>{formatFieldValue(field, value)}</>;
}

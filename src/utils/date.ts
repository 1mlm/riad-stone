const MS_PER_DAY = 86_400_000;

const getStartOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

// week starts monday
const getStartOfWeek = (d: Date) => {
  const x = getStartOfDay(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};

// these compare the dates themselves, not elapsed time
// monday to wednesday is always 2 days apart no matter what the clock says
const getDayDiff = (a: Date, b: Date) =>
  Math.round(
    (getStartOfDay(a).getTime() - getStartOfDay(b).getTime()) / MS_PER_DAY,
  );
const getWeekDiff = (a: Date, b: Date) =>
  Math.round(
    (getStartOfWeek(a).getTime() - getStartOfWeek(b).getTime()) /
      (7 * MS_PER_DAY),
  );
const getMonthDiff = (a: Date, b: Date) =>
  (a.getFullYear() - b.getFullYear()) * 12 + (a.getMonth() - b.getMonth());

export type RelativeBucket =
  | "today"
  | "yesterday"
  | "week"
  | "month"
  | "earlier";

// buckets a past date into the groups used by the Historique page, by calendar
// day/week/month distance rather than raw elapsed time
export function getRelativeBucket(
  date: Date,
  now: Date = new Date(),
): RelativeBucket {
  const days = getDayDiff(now, date);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (getWeekDiff(now, date) === 0) return "week";
  if (getMonthDiff(now, date) === 0) return "month";
  return "earlier";
}

const dateToTimeString = (d: Date) =>
  d.toLocaleTimeString("fr-FR", { hour: "numeric", minute: "2-digit" });

// French only marks the 1st of the month ("1er"), every other day is bare
const formatDayNumber = (day: number) => (day === 1 ? "1er" : String(day));

// "4 juillet 2026 16:24 UTC+1"
export function formatExactDate(date: Date | string | number): string {
  const target = new Date(date);
  const month = target.toLocaleDateString("fr-FR", { month: "long" });
  const day = target.getDate();
  const year = target.getFullYear();
  const time = dateToTimeString(target);
  const offset = target
    .toLocaleTimeString("fr-FR", { timeZoneName: "shortOffset" })
    .split(" ")
    .pop();

  return `${formatDayNumber(day)} ${month} ${year} ${time} ${offset}`;
}

// "dans 2 jours" for future, "il y a 2 jours" for past
const formatRelativeLabel = (
  n: number,
  singular: string,
  plural: string,
  future: boolean,
) => {
  const label = `${n} ${n > 1 ? plural : singular}`;
  return future ? `Dans ${label}` : `Il y a ${label}`;
};

// relative date based on calendar buckets not raw duration
// tomorrow at 4am reads "demain à 4:00" even if that's only 5 hours away
// today stays fine grained (just now / minutes / hours) since "aujourd'hui à ..." isn't relative enough
// falls through the biggest matching bucket: now, minute, hour, day, week, month, year
export function formatRelativeDate(
  date: Date | string | number,
  now: Date = new Date(),
): string {
  const target = new Date(date);
  const seconds = (target.getTime() - now.getTime()) / 1000;
  const future = seconds > 0;

  const days = getDayDiff(target, now);
  if (days === 0) {
    if (Math.abs(seconds) < 60) return "À l'instant";
    const minutes = Math.round(Math.abs(seconds) / 60);
    if (minutes < 60)
      return formatRelativeLabel(minutes, "minute", "minutes", future);
    const hours = Math.round(Math.abs(seconds) / 3600);
    return formatRelativeLabel(hours, "heure", "heures", future);
  }

  const time = dateToTimeString(target);
  if (days === 1) return `Demain à ${time}`;
  if (days === -1) return `Hier à ${time}`;
  if (Math.abs(days) < 7)
    return `${formatRelativeLabel(Math.abs(days), "jour", "jours", days > 0)} à ${time}`;

  const weeks = getWeekDiff(target, now);
  if (Math.abs(weeks) < 5)
    return formatRelativeLabel(
      Math.abs(weeks),
      "semaine",
      "semaines",
      weeks > 0,
    );

  const months = getMonthDiff(target, now);
  if (Math.abs(months) < 12)
    return formatRelativeLabel(Math.abs(months), "mois", "mois", months > 0);

  const years = target.getFullYear() - now.getFullYear();
  return formatRelativeLabel(Math.abs(years), "an", "ans", years > 0);
}

// "1h 30m", "45m", "2h" — compact, no unit words needed for a two-unit max
export function formatDurationMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

const DURATION_UNITS = [
  ["jour", "jours", 86400],
  ["heure", "heures", 3600],
  ["minute", "minutes", 60],
  ["seconde", "secondes", 1],
] as const;

// "2 jours, 3 heures et 35 secondes", skips units that are zero
export function formatDetailedDuration(
  date: Date | string | number,
  now: Date = new Date(),
): string {
  const target = new Date(date);
  const future = target.getTime() > now.getTime();
  const totalSeconds = Math.abs(
    Math.round((target.getTime() - now.getTime()) / 1000),
  );

  const { parts } = DURATION_UNITS.reduce(
    ({ remaining, parts }, [singular, plural, secondsPerUnit]) => {
      const amount = Math.floor(remaining / secondsPerUnit);
      const label =
        amount > 0 ? [`${amount} ${amount > 1 ? plural : singular}`] : [];
      return {
        remaining: remaining % secondsPerUnit,
        parts: [...parts, ...label],
      };
    },
    { remaining: totalSeconds, parts: [] as string[] },
  );

  const joined =
    parts.length > 1
      ? `${parts.slice(0, -1).join(", ")} et ${parts.at(-1)}`
      : (parts[0] ?? "moins d'une seconde");

  return future ? `dans ${joined}` : `il y a ${joined}`;
}

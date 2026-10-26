const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
const day = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "Europe/London" });

export const formatTime = (iso: string) => time.format(new Date(iso));

/** Inbox timestamp: time today, weekday this week, otherwise a date. */
export function formatRelative(iso: string, now = new Date()) {
  const d = new Date(iso);
  const diffDays = (now.getTime() - d.getTime()) / 86_400_000;
  if (diffDays < 1 && now.getDate() === d.getDate()) return formatTime(iso);
  if (diffDays < 7) return day.format(d);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

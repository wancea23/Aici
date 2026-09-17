const dateFormat = new Intl.DateTimeFormat("ro-RO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Chisinau",
});

const relativeFormat = new Intl.RelativeTimeFormat("ro", { numeric: "auto" });

const dayFormat = new Intl.DateTimeFormat("ro-RO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Chisinau",
});

// Fixed time zone so the server and the browser print the same thing.
export function formatDate(iso: string) {
  return dateFormat.format(new Date(iso));
}

export function formatDay(iso: string) {
  return dayFormat.format(new Date(iso));
}

// Romanian puts "de" after the number from 20 on, but not for 101 to 119, 201 to 219 and so on.
export function howMany(n: number, noun: string) {
  const rest = n % 100;
  return n >= 20 && (rest === 0 || rest >= 20) ? `${n} de ${noun}` : `${n} ${noun}`;
}

// Short relative time for lists, and the full date once it is older than a week.
export function timeAgo(iso: string) {
  const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (minutes > -1) return "chiar acum";
  if (minutes > -60) return relativeFormat.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours > -24) return relativeFormat.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (days > -7) return relativeFormat.format(days, "day");
  return formatDate(iso);
}

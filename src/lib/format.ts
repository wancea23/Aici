const dateFormat = new Intl.DateTimeFormat("ro-RO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Chisinau",
});

// Fixed time zone so the server and the browser print the same thing.
export function formatDate(iso: string) {
  return dateFormat.format(new Date(iso));
}

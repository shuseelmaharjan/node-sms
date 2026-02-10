export function toSentenceCase(value?: string | null): string {
  if (!value) return "";

  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w|\s\w/g, (c) => c.toUpperCase());
}

/**
 * Date Utilities
 * --------------
 * Supports ISO strings, Date, timestamp
 * Output example: 09 Feb 2026, 03:24 PM
 */

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function toDate(input?: string | number | Date | null): Date | null {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Format → 09 Feb 2026 */
export function formatDateShort(input?: string | number | Date | null): string {
  const d = toDate(input);
  if (!d) return "-";

  const day = pad(d.getDate());
  const month = MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
}

/** Format → 09 Feb 2026, 03:24 PM */
export function formatDateTime(input?: string | number | Date | null): string {
  const d = toDate(input);
  if (!d) return "-";

  const date = formatDateShort(d);

  let hours = d.getHours();
  const minutes = pad(d.getMinutes());
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;

  return `${date}, ${pad(hours)}:${minutes} ${ampm}`;
}

/** Format only time → 03:24 PM */
export function formatTime(input?: string | number | Date | null): string {
  const d = toDate(input);
  if (!d) return "-";

  let hours = d.getHours();
  const minutes = pad(d.getMinutes());
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;

  return `${pad(hours)}:${minutes} ${ampm}`;
}

/** Relative time → "2 hours ago" */
export function formatRelative(input?: string | number | Date | null): string {
  const d = toDate(input);
  if (!d) return "-";

  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);

  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`;
  if (sec < 2592000) return `${Math.floor(sec / 86400)} day ago`;
  if (sec < 31536000) return `${Math.floor(sec / 2592000)} mo ago`;

  return `${Math.floor(sec / 31536000)} yr ago`;
}

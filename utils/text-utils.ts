export function toSentenceCase(value?: string | null): string {
  if (!value) return "";

  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w|\s\w/g, (c) => c.toUpperCase());
}

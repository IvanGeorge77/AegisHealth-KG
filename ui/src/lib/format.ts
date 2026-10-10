/* ============================================================================
   Formatting helpers
   ----------------------------------------------------------------------------
   Dates and identifiers are formatted in exactly one place so that metadata
   typography stays consistent across every screen.
   ========================================================================= */

/**
 * Builds an ISO timestamp `n` days before now.
 *
 * Demonstration records are anchored relative to the current date rather than
 * hard-coded, so the workspace never looks abandoned while the fictional
 * scenarios stay internally consistent (documents always predate the case's
 * last update, and the queue always reads as "recently touched").
 */
export function daysAgo(n: number, hour = 9, minute = 15): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

/** "14 Mar 2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** "14 Mar 2026, 09:15" */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * "Today", "Yesterday", "4 days ago", "3 weeks ago", "12 Mar 2026".
 * Used where recency matters more than the exact date.
 */
export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const days = Math.floor((Date.now() - then) / 86_400_000);

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 28) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  return formatDate(iso);
}

/** "2" / "1" / "12" — with the noun supplied by the caller. */
export function pluralise(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
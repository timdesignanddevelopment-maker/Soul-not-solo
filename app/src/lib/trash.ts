// Shared soft-delete retention policy: deleted items keep their data
// (marked with `deletedAt`) for this long before a purge sweep removes them
// for good, so a stray tap on a delete "x" isn't permanent by accident.
export const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export function isExpired(deletedAt: number): boolean {
  return Date.now() - deletedAt > TRASH_RETENTION_MS;
}

export function daysRemaining(deletedAt: number): number {
  const msLeft = TRASH_RETENTION_MS - (Date.now() - deletedAt);
  return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
}

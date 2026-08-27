/**
 * Prototype id generation. The candidate product will use ULIDs (ADR-0006),
 * but this prototype mints short, readable ids so fixture data stays easy to
 * eyeball. Kept in one place because the same scheme is used when creating
 * locations, items and movements.
 */
export const ID_PREFIX = {
  location: 'loc',
  item: 'item',
  movement: 'mov',
} as const;

/** Mints a `prefix-<timestamp>-<random>` id unique enough for a demo dataset. */
export function newPrototypeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
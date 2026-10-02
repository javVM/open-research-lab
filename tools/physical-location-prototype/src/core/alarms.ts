import type { Dataset } from './models';

export type AlarmKind = 'overdue_checkout';

export interface Alarm {
  /**
   * Stable identifier derived from the triggering item, so an alarm cannot
   * be dismissed independently of resolving its underlying cause.
   */
  id: string;
  kind: AlarmKind;
  itemId: string;
  catalogueNumber: string;
  dueBackAt: string;
}

/**
 * Alarms are non-dismissable notifications derived from the current state of
 * the collection: they exist while their cause exists and disappear only
 * once that cause is resolved (e.g. the item is checked back in). The single
 * implemented alarm is an item checked out past its expected return time.
 *
 * `now` is passed in explicitly so the computation is deterministic and
 * testable with a fixed clock.
 */
export function computeAlarms(dataset: Dataset, now: string | number | Date): Alarm[] {
  const nowMs = new Date(now).getTime();
  const alarms: Alarm[] = [];
  for (const item of dataset.items) {
    if (item.status !== 'checked_out' || !item.dueBackAt) {
      continue;
    }
    if (new Date(item.dueBackAt).getTime() <= nowMs) {
      alarms.push({
        id: `alarm:overdue_checkout:${item.id}`,
        kind: 'overdue_checkout',
        itemId: item.id,
        catalogueNumber: item.catalogueNumber,
        dueBackAt: item.dueBackAt,
      });
    }
  }
  return alarms.sort((a, b) =>
    a.dueBackAt < b.dueBackAt ? -1 : a.dueBackAt > b.dueBackAt ? 1 : 0,
  );
}

import type { Dataset, ItemCategory, ItemStatus } from './models';
import { itemCountsByLocation } from './search';

/** How many individual categories are shown in the category chart; the rest collapse to "Others". */
export const CATEGORY_CHART_TOP_COUNT = 10;

export type ReportMovementAction = 'placed' | 'extracted' | 'transferred';

/** Fixed presentation order for item statuses, so segments read consistently. */
export const REPORT_STATUS_ORDER: readonly ItemStatus[] = [
  'active',
  'checked_out',
  'lost',
  'archived',
];

export interface ReportStatusSegment {
  status: ItemStatus;
  count: number;
  /** Share of the whole collection, 0..1. */
  fraction: number;
}

export interface ReportBuildingSegment {
  buildingId: string;
  name: string;
  count: number;
  /** Share of the whole collection, 0..1. */
  fraction: number;
}

export interface ReportCategorySegment {
  category: ItemCategory | 'others';
  count: number;
  /** Share of the whole collection, 0..1. */
  fraction: number;
}

export interface ReportMovementTimelinePoint {
  /** Month in ISO `YYYY-MM` form, ordered chronologically within a series. */
  month: string;
  count: number;
}

export interface ReportMovementTimelineSeries {
  action: ReportMovementAction;
  points: ReportMovementTimelinePoint[];
}

export interface ReportMovementRow {
  movementId: string;
  itemId: string;
  catalogueNumber: string;
  action: ReportMovementAction;
  locationName: string | null;
  occurredAt: string;
  performedBy: string | null;
}

export interface ReportSummary {
  totalItems: number;
  locatedItems: number;
  unlocatedItems: number;
  locationsInUse: number;
  /** Percentage of the collection that is currently located, one decimal place. */
  integrityPercent: number;
  statusSegments: ReportStatusSegment[];
  buildingSegments: ReportBuildingSegment[];
  categorySegments: ReportCategorySegment[];
  movementTimeline: ReportMovementTimelineSeries[];
  recentMovements: ReportMovementRow[];
}

/**
 * Classifies a movement from its endpoints. A movement from nowhere is a
 * placement (accession), a movement to nowhere an extraction, and anything
 * between two locations a transfer.
 */
export function classifyMovement(
  fromLocationId: string | null,
  toLocationId: string | null,
): ReportMovementAction {
  if (fromLocationId === null && toLocationId !== null) {
    return 'placed';
  }
  if (fromLocationId !== null && toLocationId === null) {
    return 'extracted';
  }
  return 'transferred';
}

function fraction(count: number, total: number): number {
  return total === 0 ? 0 : count / total;
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * A read-only analytics snapshot of the dataset. Pure and framework-free so
 * it lives next to `search`/`tree` and is trivially unit-testable.
 */
export function computeReportSummary(dataset: Dataset, recentMovementLimit = 8): ReportSummary {
  const totalItems = dataset.items.length;

  const locatedIds = new Set<string>();
  let locatedItems = 0;
  for (const item of dataset.items) {
    if (item.locationId) {
      locatedItems += 1;
      locatedIds.add(item.locationId);
    }
  }
  const unlocatedItems = totalItems - locatedItems;

  const integrityPercent = roundToTenth(fraction(locatedItems, totalItems) * 100);

  const statusCounts = new Map<ItemStatus, number>();
  for (const status of REPORT_STATUS_ORDER) {
    statusCounts.set(status, 0);
  }
  for (const item of dataset.items) {
    statusCounts.set(item.status, (statusCounts.get(item.status) ?? 0) + 1);
  }
  const statusSegments: ReportStatusSegment[] = REPORT_STATUS_ORDER.map((status) => ({
    status,
    count: statusCounts.get(status) ?? 0,
    fraction: fraction(statusCounts.get(status) ?? 0, totalItems),
  }));

  const categoryCounts = new Map<ItemCategory, number>();
  for (const item of dataset.items) {
    categoryCounts.set(item.category, (categoryCounts.get(item.category) ?? 0) + 1);
  }
  const sortedCategories = [...categoryCounts.entries()].sort(
    ([, countA], [, countB]) => countB - countA,
  );
  const topCategories = sortedCategories.slice(0, CATEGORY_CHART_TOP_COUNT);
  const remainingCategories = sortedCategories.slice(CATEGORY_CHART_TOP_COUNT);
  const othersCount = remainingCategories.reduce((sum, [, count]) => sum + count, 0);

  const categorySegments: ReportCategorySegment[] = topCategories.map(([category, count]) => ({
    category,
    count,
    fraction: fraction(count, totalItems),
  }));
  if (othersCount > 0) {
    categorySegments.push({
      category: 'others',
      count: othersCount,
      fraction: fraction(othersCount, totalItems),
    });
  }

  const countsByLocation = itemCountsByLocation(dataset);
  const buildingSegments: ReportBuildingSegment[] = dataset.locations
    .filter((location) => location.type === 'building')
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .map((building) => {
      const count = countsByLocation.get(building.id) ?? 0;
      return {
        buildingId: building.id,
        name: building.name,
        count,
        fraction: fraction(count, totalItems),
      };
    });

  const actionCountsByMonth = new Map<ReportMovementAction, Map<string, number>>();
  const months = new Set<string>();
  for (const movement of dataset.movements) {
    const action = classifyMovement(movement.fromLocationId, movement.toLocationId);
    const month = movement.occurredAt.slice(0, 7);
    months.add(month);
    if (!actionCountsByMonth.has(action)) {
      actionCountsByMonth.set(action, new Map());
    }
    const actionMonthCounts = actionCountsByMonth.get(action)!;
    actionMonthCounts.set(month, (actionMonthCounts.get(month) ?? 0) + 1);
  }
  const sortedMonths = [...months].sort();
  const movementTimeline: ReportMovementTimelineSeries[] = [...actionCountsByMonth.entries()]
    .sort(([actionA], [actionB]) => actionA.localeCompare(actionB))
    .map(([action, countsByMonth]) => ({
      action,
      points: sortedMonths.map((month) => ({
        month,
        count: countsByMonth.get(month) ?? 0,
      })),
    }));

  const locationNames = new Map(
    dataset.locations.map((location) => [location.id, location.name]),
  );
  const recentMovements: ReportMovementRow[] = dataset.movements
    .slice()
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, recentMovementLimit)
    .map((movement) => {
      const item = dataset.items.find((candidate) => candidate.id === movement.itemId);
      const action = classifyMovement(movement.fromLocationId, movement.toLocationId);
      const endpointId =
        action === 'extracted' ? movement.fromLocationId : movement.toLocationId;
      const locationName = endpointId
        ? (locationNames.get(endpointId) ?? null)
        : null;
      return {
        movementId: movement.id,
        itemId: movement.itemId,
        catalogueNumber: item?.catalogueNumber ?? movement.itemId,
        action,
        locationName,
        occurredAt: movement.occurredAt,
        performedBy: movement.performedBy ?? null,
      };
    });

  return {
    totalItems,
    locatedItems,
    unlocatedItems,
    locationsInUse: locatedIds.size,
    integrityPercent,
    statusSegments,
    buildingSegments,
    categorySegments,
    movementTimeline,
    recentMovements,
  };
}

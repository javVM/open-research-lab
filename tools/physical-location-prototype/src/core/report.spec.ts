import { generateSeed } from './seed';
import {
  CATEGORY_CHART_TOP_COUNT,
  classifyMovement,
  computeReportSummary,
  REPORT_STATUS_ORDER,
} from './report';
import type { Dataset } from './models';

describe('classifyMovement', () => {
  it('classifies accessions as placed', () => {
    expect(classifyMovement(null, 'loc-1')).toBe('placed');
  });

  it('classifies removals as extracted', () => {
    expect(classifyMovement('loc-1', null)).toBe('extracted');
  });

  it('classifies movement between two locations as transferred', () => {
    expect(classifyMovement('loc-1', 'loc-2')).toBe('transferred');
  });
});

describe('computeReportSummary', () => {
  it('counts the whole collection, located and unlocated', () => {
    const summary = computeReportSummary(generateSeed());
    expect(summary.totalItems).toBe(150);
    expect(summary.locatedItems + summary.unlocatedItems).toBe(summary.totalItems);
    expect(summary.unlocatedItems).toBe(
      generateSeed().items.filter((item) => item.locationId === null).length,
    );
  });

  it('derives integrity as the share of items that are located', () => {
    const dataset = generateSeed();
    const summary = computeReportSummary(dataset);
    const expected = Math.round((summary.locatedItems / summary.totalItems) * 1000) / 10;
    expect(summary.integrityPercent).toBe(expected);
  });

  it('splits the collection across every status, summing to the total', () => {
    const summary = computeReportSummary(generateSeed());
    expect(summary.statusSegments.map((segment) => segment.status)).toEqual([
      ...REPORT_STATUS_ORDER,
    ]);
    expect(summary.statusSegments.reduce((sum, segment) => sum + segment.count, 0)).toBe(
      summary.totalItems,
    );
  });

  it('rolls every located item up under its building', () => {
    const summary = computeReportSummary(generateSeed());
    expect(summary.buildingSegments.reduce((sum, segment) => sum + segment.count, 0)).toBe(
      summary.locatedItems,
    );
    expect(summary.buildingSegments.length).toBe(5);
  });

  it('splits items by their category field, collapsing the long tail into Others', () => {
    const summary = computeReportSummary(generateSeed());
    expect(summary.categorySegments.reduce((sum, segment) => sum + segment.count, 0)).toBe(
      summary.totalItems,
    );
    const categories = new Set(generateSeed().items.map((item) => item.category));
    const expectedSegments = Math.min(categories.size, CATEGORY_CHART_TOP_COUNT) +
      (categories.size > CATEGORY_CHART_TOP_COUNT ? 1 : 0);
    expect(summary.categorySegments.length).toBe(expectedSegments);
    expect(summary.categorySegments.some((segment) => segment.category === 'others')).toBe(
      categories.size > CATEGORY_CHART_TOP_COUNT,
    );
  });

  it('builds a monthly movement timeline with one series per action', () => {
    const summary = computeReportSummary(generateSeed());
    expect(summary.movementTimeline.length).toBeGreaterThan(0);
    for (const series of summary.movementTimeline) {
      expect(series.points.length).toBeGreaterThan(0);
      expect(series.points.reduce((sum, point) => sum + point.count, 0)).toBeGreaterThan(0);
      const months = series.points.map((point) => point.month);
      expect(months).toEqual([...months].sort());
    }
  });

  it('lists the most recent movements first, within the limit', () => {
    const summary = computeReportSummary(generateSeed(), 5);
    expect(summary.recentMovements.length).toBe(5);
    const times = summary.recentMovements.map((row) => row.occurredAt);
    const sorted = [...times].sort((a, b) => b.localeCompare(a));
    expect(times).toEqual(sorted);
  });

  it('resolves each movement row to its item and destination', () => {
    const summary = computeReportSummary(generateSeed());
    for (const row of summary.recentMovements) {
      expect(row.catalogueNumber).not.toBe('');
      if (row.action !== 'extracted') {
        expect(row.locationName).not.toBeNull();
      }
    }
  });

  it('handles an empty collection without dividing by zero', () => {
    const empty: Dataset = { locations: [], items: [], movements: [] };
    const summary = computeReportSummary(empty);
    expect(summary.totalItems).toBe(0);
    expect(summary.integrityPercent).toBe(0);
    expect(summary.statusSegments.every((segment) => segment.fraction === 0)).toBe(true);
    expect(summary.buildingSegments).toEqual([]);
    expect(summary.recentMovements).toEqual([]);
  });

  it('includes the agent who performed the movement', () => {
    const summary = computeReportSummary(generateSeed());
    expect(summary.recentMovements.length).toBeGreaterThan(0);
    expect(summary.recentMovements.some((row) => row.performedBy)).toBe(true);
  });
});

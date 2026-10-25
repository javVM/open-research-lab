export type MetricWidgetKind =
  | 'metric-total-items'
  | 'metric-locations-in-use'
  | 'metric-unlocated'
  | 'metric-integrity';

export type DonutWidgetKind = 'donut-status' | 'donut-category' | 'donut-building';

export type TimelineWidgetKind = 'timeline';

export type TableWidgetKind = 'table-recent';

export type WidgetKind = MetricWidgetKind | DonutWidgetKind | TimelineWidgetKind | TableWidgetKind;

export const WIDGET_KIND = {
  METRIC_TOTAL_ITEMS: 'metric-total-items',
  METRIC_LOCATIONS_IN_USE: 'metric-locations-in-use',
  METRIC_UNLOCATED: 'metric-unlocated',
  METRIC_INTEGRITY: 'metric-integrity',
  DONUT_STATUS: 'donut-status',
  DONUT_CATEGORY: 'donut-category',
  DONUT_BUILDING: 'donut-building',
  TIMELINE: 'timeline',
  TABLE_RECENT: 'table-recent',
} as const;

export const ALL_WIDGET_KINDS: readonly WidgetKind[] = [
  WIDGET_KIND.METRIC_TOTAL_ITEMS,
  WIDGET_KIND.METRIC_LOCATIONS_IN_USE,
  WIDGET_KIND.METRIC_UNLOCATED,
  WIDGET_KIND.METRIC_INTEGRITY,
  WIDGET_KIND.DONUT_STATUS,
  WIDGET_KIND.DONUT_CATEGORY,
  WIDGET_KIND.DONUT_BUILDING,
  WIDGET_KIND.TIMELINE,
  WIDGET_KIND.TABLE_RECENT,
] as const;

export interface DashboardTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly widgetKinds: readonly WidgetKind[];
}

export interface DashboardState {
  readonly activeTemplateId: string;
  readonly templates: readonly DashboardTemplate[];
}

export function isMetricKind(kind: WidgetKind): kind is MetricWidgetKind {
  return kind.startsWith('metric-');
}

export function isDonutKind(kind: WidgetKind): kind is DonutWidgetKind {
  return kind.startsWith('donut-');
}

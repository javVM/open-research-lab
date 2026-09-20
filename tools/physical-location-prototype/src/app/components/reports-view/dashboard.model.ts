export type MetricWidgetKind =
  | 'metric-total-items'
  | 'metric-locations-in-use'
  | 'metric-unlocated'
  | 'metric-integrity';

export type DonutWidgetKind = 'donut-status' | 'donut-category' | 'donut-building';

export type TimelineWidgetKind = 'timeline';

export type TableWidgetKind = 'table-recent';

export type WidgetKind = MetricWidgetKind | DonutWidgetKind | TimelineWidgetKind | TableWidgetKind;

export const ALL_WIDGET_KINDS: readonly WidgetKind[] = [
  'metric-total-items',
  'metric-locations-in-use',
  'metric-unlocated',
  'metric-integrity',
  'donut-status',
  'donut-category',
  'donut-building',
  'timeline',
  'table-recent',
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

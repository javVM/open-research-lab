import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import type { ItemCategory, ItemStatus } from '../../../core/models';
import { computeReportSummary, type ReportMovementAction } from '../../../core/report';
import { CollectionService } from '../../collection.service';
import { SettingsService } from '../../settings.service';
import { TranslationService } from '../../i18n/translation.service';
import { createItemCategoryTranslations } from '../../shared/item-category.translations';
import { registerAppIcons } from '../../shared/icons';
import { DonutChartComponent, type DonutChartSegment } from '../donut-chart/donut-chart.component';
import { LineChartComponent, type LineChartSeries } from '../line-chart/line-chart.component';
import {
  ACTION_LINE_COLOR,
  STATUS_SEGMENT_COLOR,
  categorySegmentColor,
} from './reports-view.constants';
import { createReportsViewTranslations } from './reports-view.translations';
import { ALL_WIDGET_KINDS, WIDGET_KIND } from './dashboard.model';
import type { WidgetKind } from './dashboard.model';
import { DashboardService } from './dashboard.service';
import { createDashboardTranslations } from './dashboard.translations';

/**
 * Read-only analytics view over the current dataset: key metrics, donuts for
 * status/building/category distribution, a line chart of movement activity over
 * time, and recent movements. All numbers come from `computeReportSummary`
 * (core/report.ts) — nothing is hardcoded.
 */
@Component({
  standalone: true,
  selector: 'app-reports-view',
  imports: [
    MatIconModule,
    MatButtonModule,
    DragDropModule,
    DonutChartComponent,
    LineChartComponent,
  ],
  templateUrl: './reports-view.component.html',
  styleUrl: './reports-view.component.scss',
})
export class ReportsViewComponent {
  protected readonly collection = inject(CollectionService);
  protected readonly settings = inject(SettingsService);
  protected readonly dashboard = inject(DashboardService);
  protected readonly text = createReportsViewTranslations(inject(TranslationService));
  protected readonly dashboardText = createDashboardTranslations(inject(TranslationService));
  protected readonly categoryText = createItemCategoryTranslations(inject(TranslationService));
  protected readonly showCatalog = signal(false);
  protected readonly expandedWidget = signal<WidgetKind | null>(null);
  protected readonly allWidgetKinds = ALL_WIDGET_KINDS;
  protected readonly WIDGET_KIND = WIDGET_KIND;

  constructor() {
    registerAppIcons();
  }

  protected readonly summary = computed(() => computeReportSummary(this.collection.dataset()));

  protected readonly statusDonutSegments = computed((): DonutChartSegment[] =>
    this.summary()
      .statusSegments.filter((segment) => segment.count > 0)
      .map((segment) => {
        const label = this.statusLabel(segment.status);
        const percent = Math.round(segment.fraction * 100);
        return {
          key: segment.status,
          label,
          tooltip: this.text.segmentTooltip({ label, count: segment.count, percent }),
          count: segment.count,
          percent,
          color: STATUS_SEGMENT_COLOR[segment.status],
        };
      }),
  );

  protected readonly categoryDonutSegments = computed((): DonutChartSegment[] => {
    const segments = this.summary().categorySegments.filter((segment) => segment.count > 0);
    return segments.map((segment) => {
      const label = this.categoryLabel(segment.category);
      const percent = Math.round(segment.fraction * 100);
      return {
        key: segment.category,
        label,
        tooltip: this.text.segmentTooltip({ label, count: segment.count, percent }),
        count: segment.count,
        percent,
        color: categorySegmentColor(segment.category),
      };
    });
  });

  protected readonly buildingDonutSegments = computed((): DonutChartSegment[] => {
    const segments = this.summary().buildingSegments.filter((segment) => segment.count > 0);
    const total = segments.length;
    return segments.map((segment, index) => {
      const percent = Math.round(segment.fraction * 100);
      return {
        key: segment.buildingId,
        label: segment.name,
        tooltip: this.text.segmentTooltip({ label: segment.name, count: segment.count, percent }),
        count: segment.count,
        percent,
        color: `hsl(${Math.round((index * 360) / Math.max(total, 1))} 55% 45%)`,
      };
    });
  });

  protected readonly timelineChart = computed(() => {
    const timeline = this.summary().movementTimeline;
    if (timeline.length === 0 || timeline[0].points.length === 0) {
      return null;
    }

    const months = timeline[0].points.map((point) => point.month);
    const formattedMonths = months.map((month) => this.formatMonth(month));
    const maxCount = Math.max(
      ...timeline.flatMap((series) => series.points.map((point) => point.count)),
      1,
    );

    const series: LineChartSeries[] = timeline.map((item) => ({
      key: item.action,
      label: this.actionLabel(item.action),
      color: ACTION_LINE_COLOR[item.action],
      points: item.points.map((point) => {
        const actionLabel = this.actionLabel(item.action);
        const formattedMonth = this.formatMonth(point.month);
        return {
          month: point.month,
          count: point.count,
          tooltip: this.text.timelineTooltip({
            month: formattedMonth,
            action: actionLabel,
            count: point.count,
          }),
        };
      }),
    }));

    return {
      formattedMonths,
      yTicks: this.yTicksForMax(maxCount),
      series,
    };
  });

  private yTicksForMax(maxCount: number): { value: number }[] {
    if (maxCount <= 0) {
      return [{ value: 0 }];
    }

    const targetTicks = 6;
    const roughStep = maxCount / targetTicks;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalized = roughStep / magnitude;
    const multiplier = normalized > 5 ? 10 : normalized > 2 ? 5 : 2;
    const step = multiplier * magnitude;
    const maxTick = Math.ceil(maxCount / step) * step;

    const ticks: { value: number }[] = [];
    for (let value = 0; value <= maxTick; value += step) {
      ticks.push({ value });
    }
    return ticks;
  }

  protected readonly integrityPercentLabel = computed(() => {
    const percent = this.summary().integrityPercent;
    return `${Number.isInteger(percent) ? percent : percent.toFixed(1)}%`;
  });

  protected readonly metrics = computed(() => {
    const summary = this.summary();
    return [
      {
        kind: 'metric-total-items' as const,
        icon: 'flask',
        label: this.text.metricTotalItems(),
        value: String(summary.totalItems),
        caption: null,
      },
      {
        kind: 'metric-locations-in-use' as const,
        icon: 'place',
        label: this.text.metricLocationsInUse(),
        value: String(summary.locationsInUse),
        caption: this.text.metricLocationsInUseCaption(),
      },
      {
        kind: 'metric-unlocated' as const,
        icon: 'warning',
        label: this.text.metricUnlocated(),
        value: String(summary.unlocatedItems),
        caption: this.text.metricUnlocatedCaption(),
      },
      {
        kind: 'metric-integrity' as const,
        icon: 'checkCircle',
        label: this.text.metricIntegrity(),
        value: this.integrityPercentLabel(),
        caption: this.text.metricIntegrityCaption(),
      },
    ];
  });

  protected readonly visibleWidgetKinds = computed(() => new Set<WidgetKind>(this.dashboard.activeTemplate().widgetKinds));

  protected readonly orderedVisibleMetrics = computed(() => {
    const order = this.dashboard.activeTemplate().widgetKinds;
    const orderIndex = new Map<WidgetKind, number>(order.map((kind, index) => [kind, index]));
    return this.metrics()
      .filter((metric) => orderIndex.has(metric.kind))
      .sort((a, b) => (orderIndex.get(a.kind) ?? 0) - (orderIndex.get(b.kind) ?? 0));
  });

  protected readonly hasVisibleMetrics = computed(() => this.orderedVisibleMetrics().length > 0);

  protected readonly hasDonutWidgets = computed(() => {
    const visible = this.visibleWidgetKinds();
    return visible.has(WIDGET_KIND.DONUT_STATUS) || visible.has(WIDGET_KIND.DONUT_CATEGORY) || visible.has(WIDGET_KIND.DONUT_BUILDING);
  });

  protected readonly isEmptyDashboard = computed(() => this.dashboard.activeTemplate().widgetKinds.length === 0);

  protected readonly fullCategoryDonutSegments = computed((): DonutChartSegment[] => {
    const dataset = this.collection.dataset();
    const totalItems = dataset.items.length || 1;
    const categoryCounts = new Map<ItemCategory, number>();
    for (const item of dataset.items) {
      categoryCounts.set(item.category, (categoryCounts.get(item.category) ?? 0) + 1);
    }
    const sorted = [...categoryCounts.entries()].sort(([, a], [, b]) => b - a);
    return sorted
      .map(([category, count]) => {
        const label = this.categoryLabel(category);
        const percent = Math.round((count / totalItems) * 100);
        return {
          key: category,
          label,
          tooltip: this.text.segmentTooltip({ label, count, percent }),
          count,
          percent,
          color: categorySegmentColor(category),
        };
      })
      .filter((segment) => segment.count > 0);
  });

  protected readonly catalogWidgets = computed(() =>
    ALL_WIDGET_KINDS.map((kind) => ({
      kind,
      label: this.dashboardText.widgetLabel(kind),
      isAdded: this.visibleWidgetKinds().has(kind),
    })),
  );

  protected readonly previewMetric = (kind: WidgetKind) => {
    switch (kind) {
      case WIDGET_KIND.METRIC_TOTAL_ITEMS:
        return { icon: 'flask', label: this.dashboardText.widgetLabel(kind), value: '150', caption: null as string | null };
      case WIDGET_KIND.METRIC_LOCATIONS_IN_USE:
        return { icon: 'place', label: this.dashboardText.widgetLabel(kind), value: '116', caption: 'holding at least one item' };
      case WIDGET_KIND.METRIC_UNLOCATED:
        return { icon: 'warning', label: this.dashboardText.widgetLabel(kind), value: '26', caption: 'not in storage' };
      case WIDGET_KIND.METRIC_INTEGRITY:
        return { icon: 'checkCircle', label: this.dashboardText.widgetLabel(kind), value: '82.7%', caption: 'of items are located' };
      default:
        return null;
    }
  };

  protected readonly previewDonutStatusSegments: DonutChartSegment[] = [
    { key: 'active', label: 'Active', tooltip: 'Active: 115 (77%)', count: 115, percent: 77, color: STATUS_SEGMENT_COLOR['active'] },
    { key: 'checked_out', label: 'Checked out', tooltip: 'Checked out: 14 (9%)', count: 14, percent: 9, color: STATUS_SEGMENT_COLOR['checked_out'] },
    { key: 'lost', label: 'Lost', tooltip: 'Lost: 13 (9%)', count: 13, percent: 9, color: STATUS_SEGMENT_COLOR['lost'] },
    { key: 'archived', label: 'Archived', tooltip: 'Archived: 8 (5%)', count: 8, percent: 5, color: STATUS_SEGMENT_COLOR['archived'] },
  ];

  protected readonly previewDonutCategorySegments: DonutChartSegment[] = [
    { key: 'a', label: 'Macrofossil', tooltip: 'Macrofossil: 12 (8%)', count: 12, percent: 8, color: '#92400e' },
    { key: 'b', label: 'Microfossil', tooltip: 'Microfossil: 10 (7%)', count: 10, percent: 7, color: '#b45309' },
    { key: 'c', label: 'Mineral / Crystal', tooltip: 'Mineral / Crystal: 18 (12%)', count: 18, percent: 12, color: '#475569' },
    { key: 'd', label: 'Others', tooltip: 'Others: 110 (73%)', count: 110, percent: 73, color: '#94a3b8' },
  ];

  protected readonly previewDonutBuildingSegments: DonutChartSegment[] = [
    { key: 'a', label: 'Building A', tooltip: 'Building A: 27 (18%)', count: 27, percent: 18, color: '#c2410c' },
    { key: 'b', label: 'Building B', tooltip: 'Building B: 24 (16%)', count: 24, percent: 16, color: '#a16207' },
    { key: 'c', label: 'Building C', tooltip: 'Building C: 28 (19%)', count: 28, percent: 19, color: '#15803d' },
    { key: 'd', label: 'Building D', tooltip: 'Building D: 28 (19%)', count: 28, percent: 19, color: '#2563eb' },
    { key: 'e', label: 'Building E', tooltip: 'Building E: 16 (11%)', count: 16, percent: 11, color: '#9333ea' },
  ];

  protected readonly previewTimelineSeries: LineChartSeries[] = [
    {
      key: 'placed',
      label: 'Placed',
      color: ACTION_LINE_COLOR['placed'],
      points: [
        { month: '2024-01', count: 8, tooltip: '01/2024: Placed — 8' },
        { month: '2024-02', count: 12, tooltip: '02/2024: Placed — 12' },
        { month: '2024-03', count: 6, tooltip: '03/2024: Placed — 6' },
      ],
    },
    {
      key: 'extracted',
      label: 'Extracted',
      color: ACTION_LINE_COLOR['extracted'],
      points: [
        { month: '2024-01', count: 3, tooltip: '01/2024: Extracted — 3' },
        { month: '2024-02', count: 5, tooltip: '02/2024: Extracted — 5' },
        { month: '2024-03', count: 2, tooltip: '03/2024: Extracted — 2' },
      ],
    },
  ];

  protected statusLabel(status: ItemStatus): string {
    switch (status) {
      case 'active':
        return this.text.statusActive();
      case 'checked_out':
        return this.text.statusCheckedOut();
      case 'lost':
        return this.text.statusLost();
      case 'archived':
        return this.text.statusArchived();
    }
  }

  protected actionLabel(action: ReportMovementAction): string {
    switch (action) {
      case 'placed':
        return this.text.actionPlaced();
      case 'extracted':
        return this.text.actionExtracted();
      case 'transferred':
        return this.text.actionTransferred();
    }
  }

  protected categoryLabel(category: ItemCategory | 'others'): string {
    if (category === 'others') {
      return this.text.othersCategory();
    }
    return this.categoryText.label(category)();
  }

  protected formatMonth(month: string): string {
    const [year, monthNumber] = month.split('-');
    return `${monthNumber}/${year}`;
  }

  protected formatOccurredAt(iso: string): string {
    const d = new Date(iso);
    if (this.settings.settings().dateFormat === 'iso') {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    return d.toLocaleString();
  }

  protected isWidgetVisible(kind: WidgetKind): boolean {
    return this.visibleWidgetKinds().has(kind);
  }

  protected widgetLabel(kind: WidgetKind): string {
    return this.dashboardText.widgetLabel(kind);
  }

  protected setWidgetEnabled(kind: WidgetKind, checked: boolean): void {
    this.dashboard.setWidgetEnabled(this.dashboard.activeTemplate().id, kind, checked);
  }

  protected openCatalog(): void {
    this.showCatalog.set(true);
  }

  protected closeCatalog(): void {
    this.showCatalog.set(false);
  }

  protected addWidgetFromCatalog(kind: WidgetKind): void {
    if (!this.isWidgetVisible(kind)) {
      this.dashboard.setWidgetEnabled(this.dashboard.activeTemplate().id, kind, true);
    }
  }

  protected onMetricsDrop(event: CdkDragDrop<readonly WidgetKind[]>): void {
    const visibleKinds = this.dashboard.activeTemplate().widgetKinds;
    const metricKinds = visibleKinds.filter((kind) => kind.startsWith('metric-'));
    const fromKind = metricKinds[event.previousIndex];
    const toKind = metricKinds[event.currentIndex];
    if (!fromKind || !toKind || fromKind === toKind) return;
    const fromIndex = visibleKinds.indexOf(fromKind);
    const toIndex = visibleKinds.indexOf(toKind);
    this.dashboard.reorderWidgets(this.dashboard.activeTemplate().id, fromIndex, toIndex);
  }

  protected onChartsDrop(event: CdkDragDrop<readonly WidgetKind[]>): void {
    const visibleKinds = this.dashboard.activeTemplate().widgetKinds;
    const donutKinds = visibleKinds.filter((kind) => kind.startsWith('donut-'));
    const fromKind = donutKinds[event.previousIndex];
    const toKind = donutKinds[event.currentIndex];
    if (!fromKind || !toKind || fromKind === toKind) return;
    const fromIndex = visibleKinds.indexOf(fromKind);
    const toIndex = visibleKinds.indexOf(toKind);
    this.dashboard.reorderWidgets(this.dashboard.activeTemplate().id, fromIndex, toIndex);
  }

  protected openChartModal(kind: WidgetKind): void {
    if (kind === WIDGET_KIND.DONUT_STATUS || kind === WIDGET_KIND.DONUT_CATEGORY || kind === WIDGET_KIND.DONUT_BUILDING) {
      this.expandedWidget.set(kind);
    }
  }

  protected closeChartModal(): void {
    this.expandedWidget.set(null);
  }
}

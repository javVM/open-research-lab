import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
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

/**
 * Read-only analytics view over the current dataset: key metrics, donuts for
 * status/building/category distribution, a line chart of movement activity over
 * time, and recent movements. All numbers come from `computeReportSummary`
 * (core/report.ts) — nothing is hardcoded.
 */
@Component({
  standalone: true,
  selector: 'app-reports-view',
  imports: [DatePipe, MatIconModule, DonutChartComponent, LineChartComponent],
  templateUrl: './reports-view.component.html',
  styleUrl: './reports-view.component.scss',
})
export class ReportsViewComponent {
  protected readonly collection = inject(CollectionService);
  protected readonly settings = inject(SettingsService);
  protected readonly text = createReportsViewTranslations(inject(TranslationService));
  protected readonly categoryText = createItemCategoryTranslations(inject(TranslationService));

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
        icon: 'flask',
        label: this.text.metricTotalItems(),
        value: String(summary.totalItems),
        caption: null,
      },
      {
        icon: 'place',
        label: this.text.metricLocationsInUse(),
        value: String(summary.locationsInUse),
        caption: this.text.metricLocationsInUseCaption(),
      },
      {
        icon: 'warning',
        label: this.text.metricUnlocated(),
        value: String(summary.unlocatedItems),
        caption: this.text.metricUnlocatedCaption(),
      },
      {
        icon: 'checkCircle',
        label: this.text.metricIntegrity(),
        value: this.integrityPercentLabel(),
        caption: this.text.metricIntegrityCaption(),
      },
    ];
  });

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
}

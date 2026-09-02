import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import type { ItemCategory, ItemStatus } from '../../../core/models';
import { computeReportSummary, type ReportMovementAction } from '../../../core/report';
import { CollectionService } from '../../collection.service';
import { TranslationService } from '../../i18n/translation.service';
import { createItemCategoryTranslations } from '../../shared/item-category.translations';
import { registerAppIcons } from '../../shared/icons';
import {
  DONUT_RADIUS,
  STATUS_SEGMENT_COLOR,
} from './reports-view.constants';
import { createReportsViewTranslations } from './reports-view.translations';

const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

/**
 * Read-only analytics view over the current dataset: key metrics, a
 * status donut, a per-building bar chart, and recent movements. All numbers
 * come from `computeReportSummary` (core/report.ts) — nothing is hardcoded.
 */
@Component({
  standalone: true,
  selector: 'app-reports-view',
  imports: [DatePipe, MatIconModule],
  templateUrl: './reports-view.component.html',
  styleUrl: './reports-view.component.scss',
})
export class ReportsViewComponent {
  protected readonly collection = inject(CollectionService);
  protected readonly text = createReportsViewTranslations(inject(TranslationService));
  protected readonly categoryText = createItemCategoryTranslations(inject(TranslationService));
  protected readonly DONUT_CIRCUMFERENCE = DONUT_CIRCUMFERENCE;

  constructor() {
    registerAppIcons();
  }

  protected readonly summary = computed(() => computeReportSummary(this.collection.dataset()));

  protected readonly donutSegments = computed(() =>
    this.buildDonutSegments(
      this.summary().statusSegments,
      (segment) => STATUS_SEGMENT_COLOR[segment.status],
      (segment) => this.statusLabel(segment.status),
    ),
  );

  protected readonly categoryDonutSegments = computed(() =>
    this.buildDonutSegments(
      this.summary().categorySegments,
      (segment, index, total) =>
        segment.category === 'others'
          ? '#94a3b8'
          : `hsl(${Math.round((index * 360) / Math.max(total, 1))} 70% 55%)`,
      (segment) => this.categoryLabel(segment.category),
    ),
  );

  protected readonly buildingDonutSegments = computed(() =>
    this.buildDonutSegments(
      this.summary().buildingSegments,
      (segment, index, total) =>
        `hsl(${Math.round((index * 360) / Math.max(total, 1))} 70% 55%)`,
      (segment) => segment.name,
    ),
  );

  private buildDonutSegments<T extends { count: number; fraction: number }>(
    segments: T[],
    colorFor: (segment: T, index: number, total: number) => string,
    labelFor: (segment: T) => string,
  ): Array<
    T & {
      label: string;
      percent: number;
      color: string;
      length: number;
      remainder: number;
      dasharray: string;
      dashoffset: string;
    }
  > {
    const filtered = segments.filter((segment) => segment.count > 0);
    const total = filtered.length;
    let cumulativeLength = 0;
    return filtered.map((segment, index) => {
      const length = segment.fraction * DONUT_CIRCUMFERENCE;
      const remainder = DONUT_CIRCUMFERENCE - length;
      const result = {
        ...segment,
        label: labelFor(segment),
        percent: Math.round(segment.fraction * 100),
        color: colorFor(segment, index, total),
        length,
        remainder,
        dasharray: `${length} ${remainder}`,
        dashoffset: `-${cumulativeLength}`,
      };
      cumulativeLength += length;
      return result;
    });
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
}

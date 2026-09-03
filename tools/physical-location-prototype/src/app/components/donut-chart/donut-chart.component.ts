import { Component, computed, input } from '@angular/core';

export interface DonutChartSegment {
  key: string;
  label: string;
  tooltip: string;
  count: number;
  percent: number;
  color: string;
}

/**
 * Reusable SVG donut chart with a centred label/value and a colour legend.
 * All text (labels and tooltips) is prepared by the parent so the component
 * stays i18n-agnostic.
 */
@Component({
  standalone: true,
  selector: 'app-donut-chart',
  templateUrl: './donut-chart.component.html',
  styleUrl: './donut-chart.component.scss',
})
export class DonutChartComponent {
  readonly segments = input.required<DonutChartSegment[]>();
  readonly centerLabel = input.required<string>();
  readonly centerValue = input.required<string | number>();
  readonly size = input<'lg' | 'md' | 'sm'>('md');
  readonly ariaLabel = input<string>('');

  protected readonly circumference = 2 * Math.PI * 40;

  protected readonly renderedSegments = computed(() => {
    let cumulativeLength = 0;
    return this.segments().map((segment) => {
      const length = (segment.percent / 100) * this.circumference;
      const remainder = this.circumference - length;
      const result = {
        ...segment,
        length,
        remainder,
        dasharray: `${length} ${remainder}`,
        dashoffset: `-${cumulativeLength}`,
      };
      cumulativeLength += length;
      return result;
    });
  });
}

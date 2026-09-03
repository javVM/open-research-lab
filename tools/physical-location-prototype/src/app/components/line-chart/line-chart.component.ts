import { Component, DestroyRef, ElementRef, computed, inject, input, signal } from '@angular/core';

export interface LineChartPoint {
  month: string;
  count: number;
  tooltip: string;
}

export interface LineChartSeries {
  key: string;
  label: string;
  color: string;
  points: LineChartPoint[];
}

export interface LineChartTick {
  value: number;
}

const MIN_WIDTH = 320;
const MIN_HEIGHT = 240;
const PADDING = { top: 24, right: 24, bottom: 80, left: 40 };

/**
 * Reusable SVG line chart for one or more time series.
 * The parent supplies the raw data, month labels and Y-axis ticks; the
 * component measures its host element and computes coordinates so the chart
 * fills the available space without distortion.
 */
@Component({
  standalone: true,
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrl: './line-chart.component.scss',
})
export class LineChartComponent {
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly series = input.required<LineChartSeries[]>();
  readonly formattedMonths = input.required<string[]>();
  readonly yTicks = input.required<LineChartTick[]>();
  readonly ariaLabel = input<string>('');
  readonly emptyMessage = input<string>('');

  private readonly hostSize = signal<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  constructor() {
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          const { width, height } = entry.contentRect;
          this.hostSize.set({ width, height });
        }
      });
      observer.observe(this.elementRef.nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    }
  }

  protected readonly layout = computed(() => {
    const width = Math.max(this.hostSize().width, MIN_WIDTH);
    const height = Math.max(this.hostSize().height, MIN_HEIGHT);

    const chartWidth = Math.max(width - PADDING.left - PADDING.right, 0);
    const chartHeight = Math.max(height - PADDING.top - PADDING.bottom, 0);

    const maxCount = Math.max(...this.yTicks().map((tick) => tick.value), 1);
    const monthCount = this.formattedMonths().length;
    const xStep = monthCount > 1 ? chartWidth / (monthCount - 1) : 0;
    const isMobile = width < 500;
    const labelWidth = isMobile ? 90 : 60;
    const maxXLabels = Math.max(2, Math.floor(chartWidth / labelWidth));
    const xTickInterval = monthCount > 0 ? Math.max(1, Math.ceil(monthCount / maxXLabels)) : 1;
    const xLabels = this.formattedMonths()
      .map((label, index) => ({ label, index }))
      .filter((_, index) => index % xTickInterval === 0 || index === monthCount - 1);

    const xForIndex = (index: number): number => PADDING.left + index * xStep;
    const yForCount = (count: number): number =>
      PADDING.top + chartHeight - (count * chartHeight) / maxCount;

    return {
      viewBox: `0 0 ${width} ${height}`,
      axisEndX: width - PADDING.right,
      axisEndY: PADDING.top + chartHeight,
      xStep,
      xLabels,
      yTicks: this.yTicks().map((tick) => ({
        value: tick.value,
        y: yForCount(tick.value),
      })),
      series: this.series().map((s) => ({
        ...s,
        points: s.points.map((point, index) => ({
          ...point,
          x: xForIndex(index),
          y: yForCount(point.count),
        })),
      })),
    };
  });
}

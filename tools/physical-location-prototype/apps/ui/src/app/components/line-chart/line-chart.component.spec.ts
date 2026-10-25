import { TestBed } from '@angular/core/testing';
import { LineChartComponent } from './line-chart.component';

describe('LineChartComponent', () => {
  it('renders one polyline and point set per series', () => {
    TestBed.configureTestingModule({});
    const fixture = TestBed.createComponent(LineChartComponent);
    fixture.componentRef.setInput('series', [
      {
        key: 'placed',
        label: 'Placed',
        color: '#22c55e',
        points: [
          { month: '2026-01', count: 2, tooltip: 'tip' },
          { month: '2026-02', count: 5, tooltip: 'tip' },
        ],
      },
    ]);
    fixture.componentRef.setInput('formattedMonths', ['01/2026', '02/2026']);
    fixture.componentRef.setInput('yTicks', [{ value: 0 }, { value: 5 }]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.line-chart__line').length).toBe(1);
    expect(el.querySelectorAll('.line-chart__point').length).toBe(2);
    expect(el.querySelectorAll('.legend-item').length).toBe(1);
  });

  it('shows the empty message when there are no series', () => {
    TestBed.configureTestingModule({});
    const fixture = TestBed.createComponent(LineChartComponent);
    fixture.componentRef.setInput('series', []);
    fixture.componentRef.setInput('formattedMonths', []);
    fixture.componentRef.setInput('yTicks', []);
    fixture.componentRef.setInput('emptyMessage', 'No data');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('No data');
  });
});

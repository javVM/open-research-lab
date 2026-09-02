import { TestBed } from '@angular/core/testing';
import { DonutChartComponent } from './donut-chart.component';

describe('DonutChartComponent', () => {
  it('renders a circle and legend item for each segment', () => {
    TestBed.configureTestingModule({});
    const fixture = TestBed.createComponent(DonutChartComponent);
    fixture.componentRef.setInput('segments', [
      { key: 'a', label: 'A', tooltip: 'A: 1 (10%)', count: 1, percent: 10, color: '#000' },
      { key: 'b', label: 'B', tooltip: 'B: 2 (20%)', count: 2, percent: 20, color: '#fff' },
    ]);
    fixture.componentRef.setInput('centerLabel', 'Total');
    fixture.componentRef.setInput('centerValue', 3);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.donut__segment').length).toBe(2);
    expect(el.querySelectorAll('.legend-item').length).toBe(2);
    expect(el.querySelector('.donut__center-value')?.textContent).toContain('3');
  });

  it('adds a tooltip title to each segment', () => {
    TestBed.configureTestingModule({});
    const fixture = TestBed.createComponent(DonutChartComponent);
    fixture.componentRef.setInput('segments', [
      { key: 'a', label: 'A', tooltip: 'A: 1 (10%)', count: 1, percent: 10, color: '#000' },
    ]);
    fixture.componentRef.setInput('centerLabel', 'Total');
    fixture.componentRef.setInput('centerValue', 1);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const title = el.querySelector('.donut__segment title');
    expect(title?.textContent).toBe('A: 1 (10%)');
  });
});

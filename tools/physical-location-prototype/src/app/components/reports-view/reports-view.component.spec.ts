import { TestBed } from '@angular/core/testing';
import { ReportsViewComponent } from './reports-view.component';
import { CollectionService } from '../../collection.service';

describe('ReportsViewComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  function collection(): CollectionService {
    return TestBed.inject(CollectionService);
  }

  it('shows the total item count from the current collection', () => {
    const fixture = TestBed.createComponent(ReportsViewComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const total = collection().dataset().items.length;
    expect(el.querySelector('.donut__center-value')?.textContent).toContain(String(total));
  });

  it('renders a legend entry for each status present in the collection', () => {
    const fixture = TestBed.createComponent(ReportsViewComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const statusCount = new Set(collection().dataset().items.map((item) => item.status)).size;
    expect(el.querySelectorAll('.chart:first-child .legend-item').length).toBe(statusCount);
  });

  it('renders a legend entry for each building in the building donut', () => {
    const fixture = TestBed.createComponent(ReportsViewComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const buildingCount = collection().dataset().locations.filter(
      (location) => location.type === 'building',
    ).length;
    expect(el.querySelectorAll('.chart--building .legend-item').length).toBe(buildingCount);
  });

  it('adds a tooltip title to every donut segment', () => {
    const fixture = TestBed.createComponent(ReportsViewComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const segments = el.querySelectorAll('.donut__segment');
    expect(segments.length).toBeGreaterThan(0);
    for (const segment of segments) {
      const title = segment.querySelector('title');
      expect(title).not.toBeNull();
      expect(title!.textContent).toContain(':');
      expect(title!.textContent).toContain('%');
    }
  });

  it('renders a movement timeline line chart', () => {
    const fixture = TestBed.createComponent(ReportsViewComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.chart--timeline .line-chart__line').length).toBeGreaterThan(0);
    expect(el.querySelectorAll('.chart--timeline .line-chart__point').length).toBeGreaterThan(0);
  });

  it('renders recent movements in the activity table', () => {
    const fixture = TestBed.createComponent(ReportsViewComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.reports__table tbody tr').length).toBeGreaterThan(0);
  });

  it('renders top categories plus an Others bucket in the category donut', () => {
    const fixture = TestBed.createComponent(ReportsViewComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const categories = new Set(collection().dataset().items.map((item) => item.category));
    const expectedSegments = Math.min(categories.size, 10) + (categories.size > 10 ? 1 : 0);
    expect(el.querySelectorAll('.chart--category .legend-item').length).toBe(expectedSegments);
    expect(el.textContent).toContain('Others');
  });
});

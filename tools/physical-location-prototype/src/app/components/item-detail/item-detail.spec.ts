import { TestBed } from '@angular/core/testing';
import { ItemDetailComponent } from './item-detail.component';
import { DataService } from '../../data.service';

describe('ItemDetailComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('shows an empty state when no item is selected', () => {
    const fixture = TestBed.createComponent(ItemDetailComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Select an item');
  });

  it('shows the catalogue number, status and breadcrumb of the selected item', () => {
    const data = TestBed.inject(DataService);
    const target = data.dataset().items.find((item) => item.locationId !== null)!;
    data.selectItem(target.id);

    const fixture = TestBed.createComponent(ItemDetailComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(target.catalogueNumber);
    const breadcrumbItems = fixture.nativeElement.querySelectorAll('.breadcrumb-list li');
    expect(breadcrumbItems.length).toBeGreaterThan(0);
  });

  it('starting a move shows the cancel button and a hint', () => {
    const data = TestBed.inject(DataService);
    const target = data.dataset().items.find((item) => item.locationId !== null)!;
    data.selectItem(target.id);

    const fixture = TestBed.createComponent(ItemDetailComponent);
    fixture.detectChanges();

    const startButton = fixture.nativeElement.querySelector('.start-move') as HTMLElement;
    startButton.click();
    fixture.detectChanges();

    expect(data.movingItemId()).toBe(target.id);
    expect(fixture.nativeElement.querySelector('.cancel-move')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.move-hint')).toBeTruthy();
  });

  it('renders history entries with an arrow between the two locations', () => {
    const data = TestBed.inject(DataService);
    const target = data
      .dataset()
      .items.find((item) => data.dataset().movements.some((m) => m.itemId === item.id))!;
    data.selectItem(target.id);

    const fixture = TestBed.createComponent(ItemDetailComponent);
    fixture.detectChanges();

    const infoButton = fixture.nativeElement.querySelector('.history-info') as HTMLElement;
    infoButton.click();
    fixture.detectChanges();

    const entries = fixture.nativeElement.querySelectorAll('.history-list li');
    expect(entries.length).toBeGreaterThan(0);
    expect(fixture.nativeElement.textContent).toContain('→');
  });
});

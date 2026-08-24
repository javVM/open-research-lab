import { TestBed } from '@angular/core/testing';
import { LocationViewComponent } from './location-view';
import { DataService } from '../../data.service';

describe('LocationViewComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('shows a prompt when nothing is selected', () => {
    const data = TestBed.inject(DataService);
    data.selectedLocationId.set(null);

    const fixture = TestBed.createComponent(LocationViewComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Select a location');
  });

  it('renders a position grid for a tray, distinguishing occupied and empty cells', () => {
    const data = TestBed.inject(DataService);
    const tray = data.dataset().locations.find((l) => l.type === 'tray')!;
    data.selectLocation(tray.id);

    const fixture = TestBed.createComponent(LocationViewComponent);
    fixture.detectChanges();

    const cells = fixture.nativeElement.querySelectorAll('.position-cell:not(.position-cell--none)');
    expect(cells.length).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelectorAll('.position-cell--empty').length).toBeGreaterThan(0);
  });

  it('renders container cards for a non-grid, non-map location (a drawer), with child names visible', () => {
    const data = TestBed.inject(DataService);
    const drawerWithTray = data.dataset().locations.find(
      (l) => l.type === 'drawer' && data.dataset().locations.some((c) => c.parentId === l.id && c.type === 'tray'),
    )!;
    data.selectLocation(drawerWithTray.id);

    const fixture = TestBed.createComponent(LocationViewComponent);
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('.container-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('shows a floor plan by default for a building (its rooms have map coordinates)', () => {
    const data = TestBed.inject(DataService);
    const building = data.dataset().locations.find((l) => l.type === 'building')!;
    data.selectLocation(building.id);

    const fixture = TestBed.createComponent(LocationViewComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-floor-plan')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.view-mode-toggle')).toBeTruthy();
  });

  it('toggling to "list" for a building switches from the floor plan to container cards', () => {
    const data = TestBed.inject(DataService);
    const building = data.dataset().locations.find((l) => l.type === 'building')!;
    data.selectLocation(building.id);

    const fixture = TestBed.createComponent(LocationViewComponent);
    fixture.detectChanges();

    const listButton = Array.from(fixture.nativeElement.querySelectorAll('.view-mode-toggle button')).find(
      (button) => (button as HTMLElement).textContent?.trim() === 'List',
    ) as HTMLElement;
    listButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-floor-plan')).toBeFalsy();
    expect(fixture.nativeElement.querySelectorAll('.container-card').length).toBeGreaterThan(0);
  });

  it('does not offer a map toggle for a location whose children have no floor-plan coordinates', () => {
    const data = TestBed.inject(DataService);
    const drawerWithTray = data.dataset().locations.find(
      (l) => l.type === 'drawer' && data.dataset().locations.some((c) => c.parentId === l.id && c.type === 'tray'),
    )!;
    data.selectLocation(drawerWithTray.id);

    const fixture = TestBed.createComponent(LocationViewComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.view-mode-toggle')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('app-floor-plan')).toBeFalsy();
  });

  it('clicking an empty position while moving requests confirmation instead of moving immediately', () => {
    const data = TestBed.inject(DataService);
    const tray = data.dataset().locations.find((l) => {
      if (l.type !== 'tray') return false;
      const positions = data.dataset().locations.filter((p) => p.parentId === l.id);
      const hasOccupied = positions.some((p) => data.dataset().items.some((i) => i.locationId === p.id));
      const hasEmpty = positions.some((p) => !data.dataset().items.some((i) => i.locationId === p.id));
      return hasOccupied && hasEmpty;
    })!;
    data.selectLocation(tray.id);

    const movingItem = data.dataset().items.find((item) =>
      data.dataset().locations.some((p) => p.id === item.locationId && p.parentId === tray.id),
    )!;
    data.startMove(movingItem.id);

    const fixture = TestBed.createComponent(LocationViewComponent);
    fixture.detectChanges();

    const emptyCell = fixture.nativeElement.querySelector('.position-cell--drop-target') as HTMLElement;
    expect(emptyCell).toBeTruthy();
    emptyCell.click();
    fixture.detectChanges();

    // Not moved yet: the modal must be confirmed first.
    expect(data.movingItemId()).toBe(movingItem.id);
    expect(data.pendingMoveTargetId()).not.toBeNull();
    const unchanged = data.dataset().items.find((i) => i.id === movingItem.id)!;
    expect(unchanged.locationId).toBe(movingItem.locationId);

    data.confirmPendingMove();

    expect(data.movingItemId()).toBeNull();
    expect(data.pendingMoveTargetId()).toBeNull();
    const updated = data.dataset().items.find((i) => i.id === movingItem.id)!;
    expect(updated.locationId).not.toBe(movingItem.locationId);
  });
});
